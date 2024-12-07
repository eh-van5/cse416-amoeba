package fshare

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	gostream "github.com/libp2p/go-libp2p-gostream"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multiaddr"
)

var (
	relay_node_addr           = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
	DownloadDirNames []string = []string{"Downloads", "downloads", "downloads", "download", "AmeobaDownloads"}
)

func getDownloadsDirectory() string {
	var downloadDir string

	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal(err)
	}

	for _, ddn := range DownloadDirNames {
		var dir = filepath.Join(homeDir, ddn)

		_, err := os.Stat(dir)
		if err == nil {
			downloadDir = dir
			break
		}
	}

	if downloadDir == "" {
		os.Mkdir("AmeobaDownloads", 0777)
		downloadDir = filepath.Join(homeDir, "AmeobaDownloads")
	}

	return downloadDir
}

func openStreamToPeer(client_node host.Host, targetpeerid string) (net.Conn, error) {
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
	if err := client_node.Connect(ctx, *peerinfo); err != nil {
		log.Printf("Failed to connect to peer %s via relay: %v", peerinfo.ID, err)
		return &net.IPConn{}, err
	}

	stream, err := gostream.Dial(network.WithAllowLimitedConn(ctx, "/get-file"), client_node, peerinfo.ID, "/get-file")
	if err != nil {
		log.Fatalf("Failed to open stream to peer: %v", err)
		return &net.IPConn{}, err
	}

	return stream, nil
}

func HttpClient(
	ctx context.Context,
	dht *dht.IpfsDHT,
	client_node host.Host,
	targetpeerid string,
	hash string,
) {
	var fileInfo FileMetadata
	// check if there are prev providers for this file
	existingValue, err := dht.GetValue(ctx, "/orcanet/"+hash)
	// found file
	if err != nil {
		fmt.Println("failed to get file: ", err)
		return
	}

	err = json.Unmarshal(existingValue, &fileInfo)
	if err != nil {
		fmt.Println("failed to decode existing providers: ", err)
		return
	}

	stream, err := openStreamToPeer(client_node, targetpeerid)

	if err != nil {
		fmt.Println("Failed to open stream to peer: ", err)
		return
	}

	client := &http.Client{
		Transport: &http.Transport{
			DialContext: func(_ context.Context, _, _ string) (net.Conn, error) {
				return stream, nil
			},
		},
	}

	res, err := client.Get("http://get-file/" + hash)

	if err != nil {
		fmt.Println("Error fetching file: ", err)
		return
	}

	defer res.Body.Close()

	if res.StatusCode >= 400 {
		fmt.Println("HTTP Error Code: ", res.StatusCode)
		return
	}

	downloadDir := getDownloadsDirectory()
	// Create a file to save the downloaded data
	outFile, err := os.Create(downloadDir + "/" + fileInfo.Name)
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

// TODO: double check the file content against the hash to ensure nothing has been changed

// TODO bitcoin transactions
