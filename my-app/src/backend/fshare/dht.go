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
	Providers map[string]FileProvider
}

func uploadFile(fileContent []byte, hash string) {
	// Create a temporary file within our temp-images directory that follows
	// a particular naming pattern
	copy, err := os.Create("../userFiles/" + hash)
	if err != nil {
		fmt.Println(err)
	}
	defer copy.Close()
	// write this byte array to our temporary file
	copy.Write(fileContent)

	// set to read-only so no one modifies the file
	errs := os.Chmod("../userFiles/"+hash, 0444)

	if err != nil {
		fmt.Println("Error making file read-only:", errs)
		return
	}
}

func generateContentHash(fileContent []byte) (cid.Cid, error) {
	// Generate CID from file content
	hash := sha256.Sum256(fileContent)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return cid.Cid{}, fmt.Errorf("error encoding multihash: %v", err)
	}
	return cid.NewCidV1(cid.Raw, mh), nil
}

func getFileInfo(
	ctx context.Context,
	dht *dht.IpfsDHT,
	dhtKey string,
	file_metadata os.FileInfo,
	file_type string,
) (FileMetadata, error) {

	var fileInfo FileMetadata
	// check if there are prev providers for this file
	existingValue, err := dht.GetValue(ctx, dhtKey)
	fmt.Println(string(existingValue))
	// found file
	if err == nil {
		// decode existing provider list if found
		err = json.Unmarshal(existingValue, &fileInfo)
		if err != nil {
			return FileMetadata{}, fmt.Errorf("failed to decode existing providers: %v", err)
		}
	} else {
		fileInfo = FileMetadata{
			Name:      file_metadata.Name(),
			Size:      int(file_metadata.Size()),
			FileType:  file_type,
			Providers: make(map[string]FileProvider),
		}
	}

	return fileInfo, nil
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

	c, err := generateContentHash(fileContent)
	if err != nil {
		return fmt.Errorf("failed to generate cid: %v", err)
	}

	dhtKey := "/orcanet/" + c.String()
	fileType := http.DetectContentType(fileContent)

	fileInfo, err := getFileInfo(ctx, dht, dhtKey, fileMetadata, fileType)
	if err != nil {
		return fmt.Errorf("failed to get file info from dht: %v", err)
	}

	// add the new provider info
	newProvider := FileProvider{
		PeerId:       dht.PeerID(),
		Price:        price,
		FileName:     fileMetadata.Name(),
		LastModified: fileMetadata.ModTime().Format(time.ANSIC),
	}
	fileInfo.Providers[newProvider.PeerId.String()] = newProvider

	fileInfoBytes, err := json.Marshal(fileInfo)
	if err != nil {
		return fmt.Errorf("failed to encode file info: %v", err)
	}

	// store the updated provider list in the DHT
	err = dht.PutValue(ctx, dhtKey, fileInfoBytes)
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

func GetProviders(ctx context.Context, dht *dht.IpfsDHT, contentHash string) (FileMetadata, error) {
	res, err := dht.GetValue(ctx, contentHash)
	var fileInfo FileMetadata
	if err != nil {
		fmt.Printf("Failed to get record: %v\n", err)
		return fileInfo, err
	}
	json.Unmarshal(res, &fileInfo)
	return fileInfo, nil
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

// TODO get all available files -- idea: make a key whose value is purely for contributing file metadata
// another idea: go look at kubo

// TODO reconcile conflicting file names, modified, etc
// For now, just accept teh first node to upload a file as complete truth

// TODO file chunking -- gross

// TODO removing files from dht
