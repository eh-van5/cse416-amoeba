package fshare

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"

	gostream "github.com/libp2p/go-libp2p-gostream"

	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
)

// STREAM COMMS WITH OTHER NODES
func HaveFileMetadata(node host.Host, filesDb *KV) {
	node.SetStreamHandler("/want/filemeta", func(s network.Stream) {
		defer s.Close()
		// Create a buffered reader to read data from the stream
		buf := bufio.NewReader(s)
		// Read data from the stream
		contentHashBytes, err := buf.ReadBytes('\n') // Reads until a newline character

		if err != nil {
			if err == io.EOF {
				log.Printf("Stream closed by peer: %s", s.Conn().RemotePeer())
			} else {
				log.Printf("Error reading from stream: %v", err)
			}
			return
		}

		contentHash := string(contentHashBytes)
		fmt.Println(contentHash)

		fileInfo, err := filesDb.GetFileInfo(contentHash)
		if err != nil {
			log.Printf("failed to get FileInfo: %v", s.Conn().RemotePeer())
			return
		}

		fileInfoBytes, err := json.Marshal(fileInfo)
		if err != nil {
			log.Printf("failed to marshal FileInfo: %v", s.Conn().RemotePeer())
			return
		}

		_, err = s.Write(fileInfoBytes)
		if err != nil {
			log.Printf("Error writing to stream: %v", err)
			return
		}
	})
}

func HttpServer(server_node host.Host) {
	listener, _ := gostream.Listen(server_node, "/get-file")
	defer listener.Close()
	fmt.Println(filepath.Abs("../userFiles"))
	http.Handle("/", http.FileServer(http.Dir("../userFiles")))

	http.Serve(listener, nil)
}

func HaveFile(node host.Host) {
	node.SetStreamHandler("/want/file", func(s network.Stream) {
		defer s.Close()
		// Create a buffered reader to read data from the stream
		buf := bufio.NewReader(s)
		// Read data from the stream
		_, err := buf.ReadBytes('\n') // Reads until a newline character
		if err != nil {
			if err == io.EOF {
				log.Printf("Stream closed by peer: %s", s.Conn().RemotePeer())
			} else {
				log.Printf("Error reading from stream: %v", err)
			}
			return
		}
		// Print the received data
		HttpServer(node)

		_, err = s.Write([]byte("success\n"))
		if err != nil {
			log.Printf("Error writing to stream: %v", err)
			return
		}
	})
}

// TODO bitcoin transactions
