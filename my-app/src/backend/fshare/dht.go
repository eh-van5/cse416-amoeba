package fshare

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	cid "github.com/ipfs/go-cid"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multihash"
)

type FileProvider struct {
	PeerId       peer.ID
	Price        int
	FileName     string
	LastModified string
}

type FileMetadata struct {
	Name      string
	Size      int
	FileType  string
	Providers []FileProvider
}

func uploadFile(fileContent []byte, hash string) {
	// Create a temporary file within our temp-images directory that follows
	// a particular naming pattern
	copy, err := os.Create("uploaded_files/" + hash)
	if err != nil {
		fmt.Println(err)
	}
	defer copy.Close()
	// write this byte array to our temporary file
	copy.Write(fileContent)
}

func createFileValue(
	file_metadata os.FileInfo,
	file_type string,
) FileMetadata {
	return FileMetadata{
		Name:     file_metadata.Name(),
		Size:     int(file_metadata.Size()),
		FileType: file_type,
	}
}

func addProvider(file_metadata FileMetadata, new_provider FileProvider) FileMetadata {

}

func ProvideKey(ctx context.Context, dht *dht.IpfsDHT, filePath string, price int) error {
	// read file content
	fileMetadata, err := os.Stat(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file metadata: %v", err)
	}

	fileContent, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %v", err)
	}

	fileType := http.DetectContentType(fileContent)

	// Generate CID from file content
	hash := sha256.Sum256(fileContent)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return fmt.Errorf("error encoding multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)

	dhtKey := "/orcanet/" + c.String()

	var fileInfo FileMetadata

	// check if there are prev providers for this file
	existingValue, err := dht.GetValue(ctx, dhtKey)

	// found file
	if err == nil {
		// decode existing provider list if found
		err = json.Unmarshal(existingValue, &fileInfo)
		if err != nil {
			return fmt.Errorf("failed to decode existing providers: %v", err)
		}
	} else {
		fileInfo = createFileValue(fileMetadata, fileType)
	}

	// add the new provider info
	newProvider := FileProvider{
		PeerId:       dht.PeerID(),
		Price:        price,
		FileName:     fileMetadata.Name(),
		LastModified: fileMetadata.ModTime().Format(time.ANSIC),
	}

	addProvider(fileInfo, newProvider)

	fileInfoValue, err := json.Marshal(fileInfo)

	// store the updated provider list in the DHT
	err = dht.PutValue(ctx, dhtKey, fileInfoValue)
	if err != nil {
		return fmt.Errorf("failed to store provider info in DHT: %v", err)
	}

	// provide file
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}

	fmt.Println("hash: ", c.String())
	uploadFile(fileContent, c.String())

	return nil
}

func GetProviders(ctx context.Context, dht *dht.IpfsDHT, contentHash string) ([]FileProvider, error) {
	res, err := dht.GetValue(ctx, contentHash)
	var providers []FileProvider
	if err != nil {
		fmt.Printf("Failed to get record: %v\n", err)
		return providers, err
	}
	json.Unmarshal(res, &providers)
	return providers, nil
}

func GetPeerAddr(ctx context.Context, dht *dht.IpfsDHT, peerId string) (peer.AddrInfo, error) {
	id, err := peer.Decode(peerId)

	if err != nil {
		fmt.Printf("Failed to decode peer: %v\n", err)
		return peer.AddrInfo{}, err
	}

	fmt.Println(id)

	res, err := dht.FindPeer(ctx, id)
	if err != nil {
		fmt.Printf("Failed to get peer: %v\n", err)
		return peer.AddrInfo{}, err
	}
	return res, err
}
