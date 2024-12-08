package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"main/fshare"
	"main/proxy"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/websocket"

	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
)

var (
	node_id             = "sbu_id" // give your SBU ID
	relay_node_addr     = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
	bootstrap_node_addr = "/ip4/127.0.0.1/tcp/61000/p2p/12D3KooWFHfjDXXaYMXUigPCe14cwGaZCzodCWrQGKXUjYraoX3t"
	globalCtx           context.Context
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	if len(os.Args) > 1 {
		node_id = os.Args[1]
	}
	http.HandleFunc("/ws", handleConnection)

	go func() {
		log.Println("Starting webscoket server on 8080")
		if err := http.ListenAndServe(":8080", nil); err != nil {
			log.Fatal("Failed to start websocket server")
		}
	}()

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
		if err := http.ListenAndServe(":8088", proxy.EnableCORS(mux)); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()
	go proxy.MonitorProxyStatus(node, dht)

	go handleInput(node, ctx, dht)

	// go fshare.HttpSetup(ctx, dht)
	// receiveDataFromPeer(node)
	// sendDataToPeer(node, "12D3KooWKNWVMpDh5ZWpFf6757SngZfyobsTXA8WzAWqmAjgcdE6")

	defer node.Close()

	select {}
}

type MessageStruct struct {
	Text      string
	ExtraData map[string]interface{}
}

func handleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error: ", err)
		return
	}
	defer conn.Close()
	log.Println("Client Connected")

	for {
		msgType, msg, msgErr := conn.ReadMessage()
		if msgErr != nil {
			log.Println("Read error: ", err)
			break
		}
		log.Printf("Raw message: %s\n", msg)
		var data map[string]interface{}
		parseErr := json.Unmarshal(msg, &data)
		if parseErr != nil {
			log.Fatalf("Error parsing JSON: %s", err)
		}

		parsedMessage := MessageStruct{
			Text:      data["message"].(string),
			ExtraData: data,
		}

		log.Printf("Received message: %s\n", parsedMessage.Text)
		parsedMessage.Text += "Modified"
		returnMsg, encodeErr := json.Marshal(parsedMessage)
		if encodeErr != nil {
			log.Fatalf("Error marshalling JSON: %s", err)
		}
		if err := conn.WriteMessage(msgType, returnMsg); err != nil {
			log.Println("Write error: ", err)
			break
		}
	}
}

func handleInput(node host.Host, ctx context.Context, dht *dht.IpfsDHT) {
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
			// dhtKey := "/orcanet/" + key
			res, err := fshare.GetProvidersHelper(ctx, dht, key)
			if err != nil {
				fmt.Println("get failed")
				fmt.Println(err)
			}
			fmt.Println("Record ", res)

		case "GET_IP":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			peerid := args[1]
			res, err := fshare.GetPeerAddr(ctx, dht, peerid)
			if err != nil {
				fmt.Println("peerid failed")
			}
			fmt.Println("Multiaddr: ", res)

		case "PUT":
			// if len(args) < 3 {
			// 	fmt.Println("Expected key and value")
			// 	continue
			// }

			// filePath := args[1]
			// price, err := strconv.Atoi(args[2])
			// if err != nil {
			// 	fmt.Println("price conversion gone awry")
			// }
			// err = fshare.ProvideKey(ctx, dht, filePath, price)
			// if err != nil {
			// 	fmt.Println("error: %v", err)
			// }
			// fmt.Println("Record stored successfully")

		case "PUT_PROVIDER":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			// key := args[1]

		case "START_SERVER":
			fshare.HttpServer(node)

		case "GET_FILE":
			if len(args) < 3 {
				fmt.Println("Expected key")
				continue
			}
			peerid := args[1]
			hash := args[2]
			// res, err := GetPeerAddr(ctx, dht, peerid)
			// if err != nil {
			// 	fmt.Println("peerid failed")
			// }

			fshare.HttpClient(ctx, dht, node, peerid, hash)

		case "REMOVE_FILEINFO":
			hash := args[1]
			var b []byte
			dht.PutValue(ctx, "/orcanet/"+hash, b)

		default:
			fmt.Println("Expected GET, GET_IP, PUT or PUT_PROVIDER")
		}
	}
}
