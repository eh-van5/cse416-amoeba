package fshare

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	gostream "github.com/libp2p/go-libp2p-gostream"

	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
)

// STREAM COMMS WITH OTHER NODES
func HaveFileMetadata(node host.Host, filesDb *KV) {
	node.SetStreamHandler("/want-filemeta", func(s network.Stream) {
		defer s.Close()
		// Create a buffered reader to read data from the stream
		buf := bufio.NewReader(s)
		// Read data from the stream
		contentHashBytes, err := buf.ReadBytes('\n') // Reads until a newline character

		if err != nil {
			if err == io.EOF {
				fmt.Printf("Stream closed by peer: %s", s.Conn().RemotePeer())
			} else {
				fmt.Printf("Error reading from stream: %v", err)
			}
			return
		}

		contentHash := string(contentHashBytes)
		contentHash = strings.TrimSpace(contentHash)

		fileInfo, err := filesDb.GetFileInfo(contentHash)
		if err != nil {
			fmt.Println(err)
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
		_, err = s.Write([]byte("\n"))
		if err != nil {
			log.Printf("Error writing to stream: %v", err)
			return
		}
	})
}

func SetupFileServer(server_node host.Host) error {
	listener, _ := gostream.Listen(server_node, "/want-file")
	defer listener.Close()
	fmt.Println(filepath.Abs("../userFiles"))
	err := http.Serve(listener, http.FileServer(http.Dir("../userFiles")))
	if err != nil {
		fmt.Println("FILE SERVER FAILED")
		return err
	}
	return nil
}

// TODO bitcoin transactions
