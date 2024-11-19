package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"main/fshare"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"

	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
)

var (
	node_id             = "sbu_id" // give your SBU ID
	relay_node_addr     = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
	bootstrap_node_addr = "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"
	globalCtx           context.Context
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
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
	go handleInput(node, ctx, dht)

	// receiveDataFromPeer(node)
	// sendDataToPeer(node, "12D3KooWKNWVMpDh5ZWpFf6757SngZfyobsTXA8WzAWqmAjgcdE6")

	defer node.Close()

	select {}
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
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error: ", err)
			break
		}
		log.Printf("Received message: %s\n", msg)
		newMsg := append(msg, []byte(" - Modified ")...)
		if err := conn.WriteMessage(msgType, newMsg); err != nil {
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
			dhtKey := "/orcanet/" + key
			res, err := fshare.GetProviders(ctx, dht, dhtKey)
			if err != nil {
				fmt.Println("get failed")
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
			if len(args) < 3 {
				fmt.Println("Expected key and value")
				continue
			}

			filePath := args[1]
			price, err := strconv.Atoi(args[2])
			if err != nil {
				fmt.Println("price conversion gone awry")
			}
			err = fshare.ProvideKey(ctx, dht, filePath, price)
			if err != nil {
				fmt.Println("error: %v", err)
			}
			fmt.Println("Record stored successfully")

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
