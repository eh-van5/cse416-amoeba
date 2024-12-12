package fshare

import (
	"bufio"
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
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multiaddr"
	"github.com/eh-van5/cse416-amoeba/server"
)

var (
	relay_node_addr           = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
	test_addr                 = "/ip4/192.168.1.27/tcp/60028/p2p/12D3KooWCwrMGLCu9TmxE4sYeHsm8jLkgS3oHDnZRZJSbfbcsHnF"
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
		downloadDir = filepath.Join(homeDir, "AmeobaDownloads")
		os.Mkdir(downloadDir, 0777)
	}

	return downloadDir
}

func FileExists(filename string) bool {
	_, err := os.Stat(filename)
	return err == nil || !os.IsNotExist(err)
}

func getNextFileVersion(filename string, fp string) string {
	version := 1
	extension := filepath.Ext(filename)
	realname := strings.TrimSuffix(filename, extension)
	for {
		versionedName := fmt.Sprintf("%s (%d)%s", realname, version, extension)
		fmt.Println(versionedName)
		versionedPath := filepath.Join(fp, versionedName)
		if !FileExists(versionedPath) {
			return versionedName
		}
		version++
	}
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

	stream, err := gostream.Dial(network.WithAllowLimitedConn(ctx, "/want-file"), client_node, peerinfo.ID, "/want-file")
	if err != nil {
		log.Fatalf("Failed to open stream to peer: %v", err)
		return &net.IPConn{}, err
	}

	return stream, nil
}

func StartHttpClient(
	ctx context.Context,
	client_node host.Host,
	targetpeerid string,
	hash string,
	filename string,
) error {
	stream, err := openStreamToPeer(client_node, targetpeerid)

	if err != nil {
		fmt.Println("Failed to open stream to peer: ", err)
		return err
	}

	client := &http.Client{
		Transport: &http.Transport{
			DialContext: func(_ context.Context, _, _ string) (net.Conn, error) {
				return stream, nil
			},
		},
	}

	res, err := client.Get("http://want-file/" + hash)

	if err != nil {
		fmt.Println("Error fetching file: ", err)
		return err
	}

	defer res.Body.Close()

	if res.StatusCode >= 400 {
		fmt.Println("HTTP Error Code: ", res.StatusCode)
		return err
	}

	downloadDir := getDownloadsDirectory()
	if FileExists(filepath.Join(downloadDir, filename)) {
		filename = getNextFileVersion(filename, downloadDir)
	}
	// Create a file to save the downloaded data

	outFile, err := os.Create(downloadDir + "/" + filename)
	if err != nil {
		fmt.Println("Error creating file:", err)
		return err
	}
	defer outFile.Close()

	// Write the file contents to disk
	_, err = io.Copy(outFile, res.Body)
	if err != nil {
		fmt.Println("Error saving file:", err)
		return err
	}
	// Ask whether file finishes downloading before returning
	return nil
}

// TODO: double check the file content against the hash to ensure nothing has been changed

// TODO bitcoin transactions

// STREAM COMMS WITH OTHER NODES
func WantFileMetadata(node host.Host, targetpeerid string, hash string) (FileInfo, error) {
	var ctx = context.Background()
	targetPeerID := strings.TrimSpace(targetpeerid)
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
		return FileInfo{}, err
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	peerinfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Fatalf("Failed to parse peer address: %s", err)
		return FileInfo{}, err
	}
	if err := node.Connect(ctx, *peerinfo); err != nil {
		log.Printf("Failed to connect to peer %s via relay: %v", peerinfo.ID, err)
		return FileInfo{}, err
	}
	s, err := node.NewStream(network.WithAllowLimitedConn(ctx, "/want-filemeta"), peerinfo.ID, "/want-filemeta")
	if err != nil {

		log.Printf("Failed to open stream to %s: %s", peerinfo.ID, err)
		return FileInfo{}, err
	}
	defer s.Close()

	fmt.Println("sending hash now")

	_, err = s.Write([]byte(hash + "\n"))
	if err != nil {
		log.Fatalf("Failed to write to stream: %s", err)
		return FileInfo{}, err
	}

	buf := bufio.NewReader(s)
	// Read data from the stream
	fileMetadataBytes, err := buf.ReadBytes('\n') // Reads until a newline character
	if err != nil {
		log.Fatalf("Failed to receive a reponse: %s", err)
		return FileInfo{}, err
	}

	var fileMetadata FileInfo
	err = json.Unmarshal(fileMetadataBytes, &fileMetadata)
	if err != nil {
		log.Fatalf("Failed to receive a reponse: %s", err)
		return FileInfo{}, err
	}

	return fileMetadata, nil
}

func WantAllFileMetadata(node host.Host, targetpeerid string) ([]FileInfo, error) {
	var ctx = context.Background()
	targetPeerID := strings.TrimSpace(targetpeerid)
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
		return []FileInfo{}, err
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	peerinfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Fatalf("Failed to parse peer address: %s", err)
		return []FileInfo{}, err
	}
	if err := node.Connect(ctx, *peerinfo); err != nil {
		log.Printf("Failed to connect to peer %s via relay: %v", peerinfo.ID, err)
		return []FileInfo{}, err
	}
	s, err := node.NewStream(network.WithAllowLimitedConn(ctx, "/want-all-filemeta"), peerinfo.ID, "/want-all-filemeta")
	if err != nil {

		log.Printf("Failed to open stream to %s: %s", peerinfo.ID, err)
		return []FileInfo{}, err
	}
	defer s.Close()

	_, err = s.Write([]byte("\n"))
	if err != nil {
		log.Fatalf("Failed to write to stream: %s", err)
		return []FileInfo{}, err
	}

	buf := bufio.NewReader(s)
	// Read data from the stream
	filesMetadataBytes, err := buf.ReadBytes('\n') // Reads until a newline character
	if err != nil {
		log.Fatalf("Failed to receive a reponse: %s", err)
		return []FileInfo{}, err
	}

	var filesMetadata []FileInfo
	err = json.Unmarshal(filesMetadataBytes, &filesMetadata)
	if err != nil {
		log.Fatalf("Failed to receive a reponse: %s", err)
		return []FileInfo{}, err
	}

	return filesMetadata, nil
}

func WantWalletAddress(node host.Host, targetpeerid string) (string, error) {
	var ctx = context.Background()
	targetPeerID := strings.TrimSpace(targetpeerid)
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
		return "", err
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	peerinfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Fatalf("Failed to parse peer address: %s", err)
		return "", err
	}
	if err := node.Connect(ctx, *peerinfo); err != nil {
		log.Printf("Failed to connect to peer %s via relay: %v", peerinfo.ID, err)
		return "", err
	}
	s, err := node.NewStream(network.WithAllowLimitedConn(ctx, "/want-wallet-address"), peerinfo.ID, "/want-wallet-address")
	if err != nil {

		log.Printf("Failed to open stream to %s: %s", peerinfo.ID, err)
		return "", err
	}
	defer s.Close()

	buf := bufio.NewReader(s)
	// Read data from the stream
	walletAddrBytes, err := buf.ReadBytes('\n') // Reads until a newline character
	if err != nil {
		log.Fatalf("Failed to receive a reponse: %s", err)
		return "", err
	}

	return string(walletAddrBytes), nil
}

// func openStreamToPeerLocal(client_node host.Host) (net.Conn, error) {
// 	var ctx = context.Background()
// 	peerMultiaddr, err := multiaddr.NewMultiaddr(test_addr)
// 	if err != nil {
// 		log.Fatalf("Failed to get peer multiaddr: %s", err)
// 	}
// 	peerinfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
// 	if err != nil {
// 		log.Fatalf("Failed to parse peer address: %s", err)
// 	}
// 	if err := client_node.Connect(ctx, *peerinfo); err != nil {
// 		log.Printf("Failed to connect to peer %s via relay: %v", peerinfo.ID, err)
// 		return &net.IPConn{}, err
// 	}

// 	stream, err := gostream.Dial(network.WithAllowLimitedConn(ctx, "/want/file"), client_node, peerinfo.ID, "/want/file")
// 	if err != nil {
// 		log.Fatalf("Failed to open stream to peer: %v", err)
// 		return &net.IPConn{}, err
// 	}

// 	return stream, nil
// }

// func HttpClientLocal(
// 	ctx context.Context,
// 	client_node host.Host,
// 	targetpeerid string,
// 	hash string,
// 	filename string,
// ) error {
// 	stream, err := openStreamToPeerLocal(client_node)

// 	if err != nil {
// 		fmt.Println("Failed to open stream to peer: ", err)
// 		return err
// 	}

// 	client := &http.Client{
// 		Transport: &http.Transport{
// 			DialContext: func(_ context.Context, _, _ string) (net.Conn, error) {
// 				return stream, nil
// 			},
// 		},
// 	}

// 	res, err := client.Get("http://want/file/" + hash)

// 	if err != nil {
// 		fmt.Println("Error fetching file: ", err)
// 		return err
// 	}

// 	defer res.Body.Close()

// 	if res.StatusCode >= 400 {
// 		fmt.Println("HTTP Error Code: ", res.StatusCode)
// 		return err
// 	}

// 	downloadDir := getDownloadsDirectory()
// 	// Create a file to save the downloaded data
// 	outFile, err := os.Create(downloadDir + "/" + filename)
// 	if err != nil {
// 		fmt.Println("Error creating file:", err)
// 		return err
// 	}
// 	defer outFile.Close()

// 	// Write the file contents to disk
// 	_, err = io.Copy(outFile, res.Body)
// 	if err != nil {
// 		fmt.Println("Error saving file:", err)
// 		return err
// 	}

// 	return nil
// }
