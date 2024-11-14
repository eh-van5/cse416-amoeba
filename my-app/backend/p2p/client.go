package p2p

import (
	"context"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"

	gostream "github.com/libp2p/go-libp2p-gostream"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
)

func httpclient(client_node host.Host, peerid string, hash string) {
	server_id, err := peer.Decode(peerid)
	if err != nil {
		log.Fatalf("Failed to open stream to peer: %v", err)
		return
	}
	stream, err := gostream.Dial(context.Background(), client_node, server_id, "/mock-http/1.0.0")
	if err != nil {
		log.Fatalf("Failed to open stream to peer: %v", err)
		return
	}
	defer stream.Close()

	client := &http.Client{
		Transport: &http.Transport{
			DialContext: func(_ context.Context, _, _ string) (net.Conn, error) {
				return stream, nil
			},
		},
	}

	res, err := client.Get("http://mock-http/hello")
	if err != nil {
		fmt.Println("Error fetching file:", err)
		return
	}
	defer res.Body.Close()

	// Create a file to save the downloaded data
	outFile, err := os.Create(hash)
	if err != nil {
		fmt.Println("Error creating file:", err)
		return
	}
	defer outFile.Close()

	// Write the file contents to disk
	_, err = io.Copy(outFile, res.Body)
	if err != nil {
		fmt.Println("Error saving file:", err)
		return
	}

	fmt.Println("File downloaded successfully!")
}
