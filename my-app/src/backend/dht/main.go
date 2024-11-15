package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/ipfs/go-cid"
	"github.com/libp2p/go-libp2p"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	record "github.com/libp2p/go-libp2p-record"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/relay"
	"github.com/multiformats/go-multiaddr"
	"github.com/multiformats/go-multihash"
)

var (
	node_id             = "SBU_Id" // give your SBU ID
	relay_node_addr     = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
	bootstrap_node_addr = "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"
	globalCtx           context.Context
)

func generatePrivateKeyFromSeed(seed []byte) (crypto.PrivKey, error) {
	hash := sha256.Sum256(seed) // Generate deterministic key material
	// Create an Ed25519 private key from the hash
	privKey, _, err := crypto.GenerateEd25519Key(
		bytes.NewReader(hash[:]),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}
	return privKey, nil
}

func createNode() (host.Host, *dht.IpfsDHT, error) {
	ctx := context.Background()
	seed := []byte(node_id)
	customAddr, err := multiaddr.NewMultiaddr("/ip4/0.0.0.0/tcp/0")
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse multiaddr: %w", err)
	}
	privKey, err := generatePrivateKeyFromSeed(seed)
	if err != nil {
		log.Fatal(err)
	}
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Fatalf("Failed to create relay multiaddr: %v", err)
	}

	// Convert the relay multiaddress to AddrInfo
	relayInfo, err := peer.AddrInfoFromP2pAddr(relayAddr)
	if err != nil {
		log.Fatalf("Failed to create AddrInfo from relay multiaddr: %v", err)
	}

	node, err := libp2p.New(
		libp2p.ListenAddrs(customAddr),
		libp2p.Identity(privKey),
		libp2p.NATPortMap(),
		libp2p.EnableNATService(),
		libp2p.EnableAutoRelayWithStaticRelays([]peer.AddrInfo{*relayInfo}),
		libp2p.EnableRelayService(),
		libp2p.EnableHolePunching(),
	)

	if err != nil {
		return nil, nil, err
	}
	_, err = relay.New(node)
	if err != nil {
		log.Printf("Failed to instantiate the relay: %v", err)
	}

	dhtRouting, err := dht.New(ctx, node, dht.Mode(dht.ModeClient))
	if err != nil {
		return nil, nil, err
	}
	namespacedValidator := record.NamespacedValidator{
		"orcanet": &CustomValidator{}, // Add a custom validator for the "orcanet" namespace
	}

	dhtRouting.Validator = namespacedValidator // Configure the DHT to use the custom validator

	err = dhtRouting.Bootstrap(ctx)
	if err != nil {
		return nil, nil, err
	}
	fmt.Println("DHT bootstrap complete.")

	// Set up notifications for new connections
	node.Network().Notify(&network.NotifyBundle{
		ConnectedF: func(n network.Network, conn network.Conn) {
			fmt.Printf("Notification: New peer connected %s\n", conn.RemotePeer().String())
		},
	})

	return node, dhtRouting, nil
}

func connectToPeer(node host.Host, peerAddr string) {
	addr, err := multiaddr.NewMultiaddr(peerAddr)
	if err != nil {
		log.Printf("Failed to parse peer address: %s", err)
		return
	}

	info, err := peer.AddrInfoFromP2pAddr(addr)
	if err != nil {
		log.Printf("Failed to get AddrInfo from address: %s", err)
		return
	}

	node.Peerstore().AddAddrs(info.ID, info.Addrs, peerstore.PermanentAddrTTL)
	err = node.Connect(context.Background(), *info)
	if err != nil {
		log.Printf("Failed to connect to peer: %s", err)
		return
	}

	fmt.Println("Connected to:", info.ID)
}

func connectToPeerUsingRelay(node host.Host, targetPeerID string) {
	ctx := globalCtx
	targetPeerID = strings.TrimSpace(targetPeerID)
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	relayedAddrInfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Println("Failed to get relayed AddrInfo: %w", err)
		return
	}
	// Connect to the peer through the relay
	err = node.Connect(ctx, *relayedAddrInfo)
	if err != nil {
		log.Println("Failed to connect to peer through relay: %w", err)
		return
	}

	fmt.Printf("Connected to peer via relay: %s\n", targetPeerID)
}

func receiveDataFromPeer(node host.Host) {
	// Set a stream handler to listen for incoming streams on the "/senddata/p2p" protocol
	node.SetStreamHandler("/senddata/p2p", func(s network.Stream) {
		defer s.Close()
		// Create a buffered reader to read data from the stream
		buf := bufio.NewReader(s)
		// Read data from the stream
		data, err := buf.ReadBytes('\n') // Reads until a newline character
		if err != nil {
			if err == io.EOF {
				log.Printf("Stream closed by peer: %s", s.Conn().RemotePeer())
			} else {
				log.Printf("Error reading from stream: %v", err)
			}
			return
		}
		// Print the received data
		log.Printf("Received data: %s", data)
	})
}

func sendDataToPeer(node host.Host, targetpeerid string) {
	var ctx = context.Background()
	targetPeerID := strings.TrimSpace(targetpeerid)
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	peerinfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Fatalf("Failed to parse peer address: %s", err)
	}
	if err := node.Connect(ctx, *peerinfo); err != nil {
		log.Printf("Failed to connect to peer %s via relay: %v", peerinfo.ID, err)
		return
	}
	s, err := node.NewStream(network.WithAllowLimitedConn(ctx, "/senddata/p2p"), peerinfo.ID, "/senddata/p2p")
	if err != nil {
		log.Printf("Failed to open stream to %s: %s", peerinfo.ID, err)
		return
	}
	defer s.Close()
	_, err = s.Write([]byte("sending hello to peer\n"))
	if err != nil {
		log.Fatalf("Failed to write to stream: %s", err)
	}

}

func handlePeerExchange(node host.Host) {
	relayInfo, _ := peer.AddrInfoFromString(relay_node_addr)
	node.SetStreamHandler("/orcanet/p2p", func(s network.Stream) {
		defer s.Close()

		buf := bufio.NewReader(s)
		peerAddr, err := buf.ReadString('\n')
		if err != nil {
			if err != io.EOF {
				fmt.Printf("error reading from stream: %v", err)
			}
		}
		peerAddr = strings.TrimSpace(peerAddr)
		var data map[string]interface{}
		err = json.Unmarshal([]byte(peerAddr), &data)
		if err != nil {
			fmt.Printf("error unmarshaling JSON: %v", err)
		}
		if knownPeers, ok := data["known_peers"].([]interface{}); ok {
			for _, peer := range knownPeers {
				fmt.Println("Peer:")
				if peerMap, ok := peer.(map[string]interface{}); ok {
					if peerID, ok := peerMap["peer_id"].(string); ok {
						if string(peerID) != string(relayInfo.ID) {
							connectToPeerUsingRelay(node, peerID)
						}
					}
				}
			}
		}
	})
}

func main() {
	if len(os.Args) > 1 {
		node_id = os.Args[1]
	}
	node, dht, err := createNode()
	if err != nil {
		log.Fatalf("Failed to create node: %s", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	globalCtx = ctx

	fmt.Println("Node multiaddresses:", node.Addrs())
	fmt.Println("Node Peer ID:", node.ID())

	connectToPeer(node, relay_node_addr) // connect to relay node
	makeReservation(node)                // make reservation on realy node
	go refreshReservation(node, 10*time.Minute)
	connectToPeer(node, bootstrap_node_addr) // connect to bootstrap node
	go handlePeerExchange(node)

	defer node.Close()

	// Get the current node ID
	peerID := node.ID().String()

	// Configure HTTP routing
	mux := http.NewServeMux()
	mux.HandleFunc("/enable-proxy", enableProxyHandler(ctx, dht, peerID))
	mux.HandleFunc("/disable-proxy", disableProxyHandler(ctx, dht, peerID))
	mux.HandleFunc("/get-proxies", getAvailableProxiesHandler(ctx, dht, node))
	mux.HandleFunc("/heartbeat", heartbeatHandler(dht, peerID))
	mux.HandleFunc("/proxy-status", proxyStatusHandler())

	// Start the HTTP server
	go func() {
		if err := http.ListenAndServe(":8080", enableCORS(mux)); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
		log.Println("Server is running on http://localhost:8080")
	}()
	go monitorProxyStatus(node, dht)
	go handleInput(ctx, dht)

	// receiveDataFromPeer(node)
	// sendDataToPeer(node, "12D3KooWKNWVMpDh5ZWpFf6757SngZfyobsTXA8WzAWqmAjgcdE6")

	select {}
}

func handleInput(ctx context.Context, dht *dht.IpfsDHT) {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("User Input \n ")
	for {
		fmt.Print("> ")
		input, _ := reader.ReadString('\n') // Read input from keyboard
		input = strings.TrimSpace(input)    // Trim any trailing newline or spaces
		args := strings.Split(input, " ")
		if len(args) < 1 {
			fmt.Println("No command provided")
			continue
		}
		command := args[0]
		command = strings.ToUpper(command)
		switch command {
		case "GET":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			key := args[1]
			dhtKey := "/orcanet/" + key
			res, err := dht.GetValue(ctx, dhtKey)
			if err != nil {
				fmt.Printf("Failed to get record: %v\n", err)
				continue
			}
			fmt.Printf("Record: %s\n", res)

		case "GET_PROVIDERS":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			key := args[1]
			data := []byte(key)
			hash := sha256.Sum256(data)
			mh, err := multihash.EncodeName(hash[:], "sha2-256")
			if err != nil {
				fmt.Printf("Error encoding multihash: %v\n", err)
				continue
			}
			c := cid.NewCidV1(cid.Raw, mh)
			providers := dht.FindProvidersAsync(ctx, c, 20)

			fmt.Println("Searching for providers...")
			for p := range providers {
				if p.ID == peer.ID("") {
					break
				}
				fmt.Printf("Found provider: %s\n", p.ID.String())
				for _, addr := range p.Addrs {
					fmt.Printf(" - Address: %s\n", addr.String())
				}
			}

		case "PUT":
			if len(args) < 3 {
				fmt.Println("Expected key and value")
				continue
			}
			key := args[1]
			value := args[2]
			dhtKey := "/orcanet/" + key
			log.Println(dhtKey)
			err := dht.PutValue(ctx, dhtKey, []byte(value))
			if err != nil {
				fmt.Printf("Failed to put record: %v\n", err)
				continue
			}
			// provideKey(ctx, dht, key)
			fmt.Println("Record stored successfully")

		case "PUT_PROVIDER":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			key := args[1]
			provideKey(ctx, dht, key)
		default:
			fmt.Println("Expected GET, GET_PROVIDERS, PUT or PUT_PROVIDER")
		}
	}
}

func provideKey(ctx context.Context, dht *dht.IpfsDHT, key string) error {
	data := []byte(key)
	hash := sha256.Sum256(data)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return fmt.Errorf("error encoding multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)

	// Start providing the key
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}
	return nil
}

func makeReservation(node host.Host) {
	ctx := globalCtx
	relayInfo, err := peer.AddrInfoFromString(relay_node_addr)
	if err != nil {
		log.Fatalf("Failed to create addrInfo from string representation of relay multiaddr: %v", err)
	}
	_, err = client.Reserve(ctx, node, *relayInfo)
	if err != nil {
		log.Fatalf("Failed to make reservation on relay: %v", err)
	}
	fmt.Printf("Reservation successfull \n")
}

func refreshReservation(node host.Host, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			makeReservation(node)
		case <-globalCtx.Done():
			fmt.Println("Context done, stopping reservation refresh.")
			return
		}
	}
}

/* Proxy Operations */
type ProxyInfo struct {
	IPAddress  string    `json:"ipAddress"`
	PricePerMB float64   `json:"pricePerMB"`
	Status     string    `json:"status"`
	LastActive time.Time `json:"lastActive"`
}

func storeProxyInfo(ctx context.Context, dht *dht.IpfsDHT, proxyInfo ProxyInfo, peerID string) error {
	key := "proxy/" + peerID
	proxyKey := "/orcanet/" + key
	value, err := json.Marshal(proxyInfo)
	if err != nil {
		return fmt.Errorf("failed to marshal proxy info: %w", err)
	}

	// Store in DHT
	err = dht.PutValue(ctx, proxyKey, value)
	if err != nil {
		return fmt.Errorf("failed to store proxy info in DHT: %w", err)
	}

	// Set node as the key provider
	if err := provideKey(ctx, dht, key); err != nil {
		return fmt.Errorf("failed to provide proxy key: %w", err)
	}

	return nil
}

func enableProxyHandler(ctx context.Context, dht *dht.IpfsDHT, peerID string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var proxyInfo ProxyInfo

		err := json.NewDecoder(r.Body).Decode(&proxyInfo)
		if err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		ip, err := getPublicIP()
		if err != nil {
			log.Printf("Failed to get public IP: %v", err)
			http.Error(w, "Failed to retrieve public IP", http.StatusInternalServerError)
			return
		}
		proxyInfo.IPAddress = ip
		proxyInfo.Status = "available"
		proxyInfo.LastActive = time.Now()

		err = storeProxyInfo(ctx, dht, proxyInfo, peerID)
		if err != nil {
			log.Printf("Failed to store proxy info: %v", err)
			http.Error(w, "Failed to enable proxy", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "Proxy Enabled"})

		proxyStatusCache.isProxyEnabled = true
	}
}

func disableProxyHandler(ctx context.Context, dht *dht.IpfsDHT, peerID string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := "/orcanet/proxy/" + peerID

		err := dht.PutValue(ctx, key, nil)
		if err != nil {
			log.Printf("Failed to update proxy info: %v", err)
			http.Error(w, "Failed to disable proxy", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "Proxy Disabled"})

		proxyStatusCache.isProxyEnabled = false
	}
}

func getAvailableProxiesHandler(ctx context.Context, dht *dht.IpfsDHT, node host.Host) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		availableProxies := listAllProxies(ctx, node, dht)

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(availableProxies)
	}
}

func getPublicIP() (string, error) {
	resp, err := http.Get("https://api.ipify.org?format=text")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	ip, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(ip), nil
}

func enableCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}

func listAllProxies(ctx context.Context, node host.Host, dht *dht.IpfsDHT) []ProxyInfo {
	proxyInfos := []ProxyInfo{}
	myID := node.ID().String()

	for _, peer := range node.Peerstore().Peers() {
		peerID := peer.String()
		if peerID == myID {
			continue
		}
		key := "/orcanet/proxy/" + peerID
		value, err := dht.GetValue(ctx, key)
		if err != nil {
			continue
		}

		var proxyInfo ProxyInfo
		err = json.Unmarshal(value, &proxyInfo)
		if err != nil {
			log.Printf("Failed to unmarshal proxy info for key %s: %v", key, err)
			continue
		}

		if proxyInfo.Status == "available" {
			proxyInfos = append(proxyInfos, proxyInfo)
		}
	}

	return proxyInfos
}

/* Heartbeat */
func heartbeatHandler(dht *dht.IpfsDHT, peerID string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := context.Background()
		key := "/orcanet/proxy/" + peerID

		value, err := dht.GetValue(ctx, key)
		if err != nil {
			log.Printf("Failed to find proxy info for heartbeat: %v", err)
			http.Error(w, "Proxy not found", http.StatusNotFound)
			return
		}

		var proxyInfo ProxyInfo
		if err := json.Unmarshal(value, &proxyInfo); err != nil {
			log.Printf("Failed to unmarshal proxy infor for heartbeat: %v", err)
			http.Error(w, "Failed to parse proxy info", http.StatusInternalServerError)
			return
		}

		proxyInfo.LastActive = time.Now()
		newValue, err := json.Marshal(proxyInfo)
		if err != nil {
			log.Printf("Failed to marshal proxy info for heartbeat: %v", err)
			http.Error(w, "Failed to update proxy info", http.StatusInternalServerError)
			return
		}

		if err := dht.PutValue(ctx, key, newValue); err != nil {
			log.Printf("Failed to store updated proxy info for heartbeat: %v", err)
			http.Error(w, "Failed to store updated proxy info", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Heartbeat received"))
	}
}

/* Proxy node Status */
var proxyStatusCache = struct {
	sync.RWMutex
	isProxyEnabled bool
}{
	isProxyEnabled: false,
}

func monitorProxyStatus(node host.Host, dht *dht.IpfsDHT) {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	ctx := context.Background()
	peerID := node.ID().String()
	key := "/orcanet/proxy/" + peerID

	for {
		<-ticker.C

		// Check self proxy node status
		value, err := dht.GetValue(ctx, key)
		if err != nil || value == nil {
			proxyStatusCache.Lock()
			proxyStatusCache.isProxyEnabled = false
			proxyStatusCache.Unlock()
			continue
		}

		proxyStatusCache.Lock()
		proxyStatusCache.isProxyEnabled = true
		proxyStatusCache.Unlock()

		// Check all other proxy nodes' status
		for _, peer := range node.Peerstore().Peers() {
			peerID := peer.String()
			key := "/orcanet/proxy/" + peerID
			value, err := dht.GetValue(ctx, key)
			if err != nil {
				continue
			}

			var proxyInfo ProxyInfo
			err = json.Unmarshal(value, &proxyInfo)
			if err != nil {
				log.Printf("Failed to unmarshal proxy info for key %s: %v", key, err)
				continue
			}

			if proxyInfo.Status == "available" && time.Since(proxyInfo.LastActive) > 12*time.Second {
				if err := dht.PutValue(ctx, key, nil); err != nil {
					log.Printf("Failed to store updated proxy info for key %s: %v", key, err)
				}
				proxyStatusCache.isProxyEnabled = false
				log.Printf("Proxy %s is deleted due to inactivity", proxyInfo.IPAddress)
			}
		}
	}
}

func proxyStatusHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxyStatusCache.RLock()
		defer proxyStatusCache.RUnlock()

		status := map[string]bool{
			"isProxyEnabled": proxyStatusCache.isProxyEnabled,
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(status)
	}
}
