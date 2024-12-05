package main

import (
	"bufio"
	"context"
	"crypto/sha256"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"main/proxy"

	"github.com/ipfs/go-cid"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multihash"
)

var (
	node_id             = "SBU_Id" // give your SBU ID
	relay_node_addr     = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
	bootstrap_node_addr = "/ip4/127.0.0.1/tcp/61000/p2p/12D3KooWFHfjDXXaYMXUigPCe14cwGaZCzodCWrQGKXUjYraoX3t"
	globalCtx           context.Context
)

//bootstrap_node_addr = "/ip4/127.0.0.1/tcp/61000/p2p/12D3KooWFHfjDXXaYMXUigPCe14cwGaZCzodCWrQGKXUjYraoX3t"
//bootstrap_node_addr = "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"

func main() {
	if len(os.Args) > 1 {
		node_id = os.Args[1]
	}
	node, dht, err := CreateNode()
	if err != nil {
		log.Fatalf("Failed to create node: %s", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	globalCtx = ctx

	fmt.Println("Node multiaddresses:", node.Addrs())
	fmt.Println("Node Peer ID:", node.ID())

	ConnectToPeer(node, relay_node_addr) // connect to relay node
	MakeReservation(node)                // make reservation on realy node
	go RefreshReservation(node, 10*time.Minute)
	ConnectToPeer(node, bootstrap_node_addr) // connect to bootstrap node
	go HandlePeerExchange(node)

	defer node.Close()

	// Get the current node ID
	peerID := node.ID().String()

	// Configure HTTP routing
	mux := http.NewServeMux()
	mux.HandleFunc("/enable-proxy", proxy.EnableProxyHandler(ctx, dht, node))
	mux.HandleFunc("/disable-proxy", proxy.DisableProxyHandler(ctx, dht, node))
	mux.HandleFunc("/use-proxy", proxy.UseProxyHandler(node))
	mux.HandleFunc("/stop-using-proxy", proxy.StopUsingProxyHandler())
	mux.HandleFunc("/get-proxies", proxy.GetAvailableProxiesHandler(ctx, dht, node))
	mux.HandleFunc("/heartbeat", proxy.HeartbeatHandler(dht, peerID))
	mux.HandleFunc("/proxy-status", proxy.ProxyStatusHandler())

	// Start the HTTP server
	go func() {
		if err := http.ListenAndServe(":8080", proxy.EnableCORS(mux)); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()
	go proxy.MonitorProxyStatus(node, dht)
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
			ProvideKey(ctx, dht, key)
		default:
			fmt.Println("Expected GET, GET_PROVIDERS, PUT or PUT_PROVIDER")
		}
	}
}
