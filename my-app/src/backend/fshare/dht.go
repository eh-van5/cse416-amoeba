package fshare

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

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
	Name     string
	Size     int
	FileType string
	Price    int
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
	// errs := os.Chmod("../userFiles/"+hash, 0444)

	// if err != nil {
	// 	fmt.Println("Error making file read-only:", errs)
	// 	return
	// }
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
	price int,
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
			Name:     file_metadata.Name(),
			Size:     int(file_metadata.Size()),
			FileType: file_type,
			Price: price
		}
	}

	return fileInfo, nil
}

func storeFileInfo(ctx context.Context, dht *dht.IpfsDHT, contentHash string, fileInfo FileMetadata) error {
	dhtKey := "/orcanet/" + dht.PeerID().String()
	existingValue, err := dht.GetValue(ctx, dhtKey)
	var priceInfo map[string]FileMetadata
	if err == nil {
		// decode existing provider list if found
		err = json.Unmarshal(existingValue, &priceInfo)
		if err != nil {
			return fmt.Errorf("failed to decode existing providers: %v", err)
		}
	} else {
		priceInfo = make(map[string]FileMetadata)
	}

	priceInfo[contentHash] = fileInfo
	priceInfoBytes, err := json.Marshal(priceInfo)
	if err != nil {
		return fmt.Errorf("failed to encode file info: %v", err)
	}

	err = dht.PutValue(ctx, dhtKey, priceInfoBytes)
	if err != nil {
		return fmt.Errorf("failed to store provider info in DHT: %v", err)
	}

	nodeHash, err := generateContentHash([]byte(dhtKey))
	if err != nil {
		return fmt.Errorf("failed to generate content hash: %v", err)
	}

	dht.Provide(ctx, nodeHash, true)
	return nil
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

	fileInfo, err := getFileInfo(ctx, dht, dhtKey, fileMetadata, fileType, price)
	if err != nil {
		return fmt.Errorf("failed to get file info from dht: %v", err)
	}

	// add the new provider info
	// newProvider := FileProvider{
	// 	PeerId:       dht.PeerID(),
	// 	Price:        price,
	// 	FileName:     fileMetadata.Name(),
	// 	LastModified: fileMetadata.ModTime().Format(time.ANSIC),
	// }
	// fileInfo.Providers[newProvider.PeerId.String()] = newProvider

	fileInfoBytes, err := json.Marshal(fileInfo)
	if err != nil {
		return fmt.Errorf("failed to encode file info: %v", err)
	}

	// store the updated provider list in the DHT
	err = dht.PutValue(ctx, dhtKey, fileInfoBytes)
	if err != nil {
		return fmt.Errorf("failed to store provider info in DHT: %v", err)
	}

	storeFileInfo(ctx, dht, c.String(), fileInfo)
	// provide file
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}

	fmt.Println("hash: ", c.String())
	uploadFile(fileContent, c.String())

	return nil
}

func GetProviders(ctx context.Context, dht *dht.IpfsDHT, contentHash string) (map[string]int, error) {

	// findProviders
	// query each provider for the file price, if there isn't don't add it in
	// provide providers and, put the file price in the node's key
	priceMap := make(map[string]int)

	cid, err := cid.Decode(contentHash)
	if err != nil {
		return priceMap, fmt.Errorf("error decoding CID %v", err)
	}

	providers, err := dht.FindProviders(ctx, cid)
	if err != nil {
		return priceMap, fmt.Errorf("error getting providers %v", err)
	}

	for _, peer := range providers {
		pricesBytes, err := dht.GetValue(ctx, "/orcanet/"+peer.ID.String())
		if err != nil {
			return priceMap, fmt.Errorf("error getting peer price %v", err)
		}
		var prices map[string]int

		err = json.Unmarshal(pricesBytes, &prices)
		if err != nil {
			return priceMap, fmt.Errorf("error unmarshaling prices %v", err)
		}

		if price, exists := prices[contentHash]; exists {
			priceMap[peer.ID.String()] = price
		}
	}

	return priceMap, nil
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

// func StopProvide(ctx context.Context, dht *dht.IpfsDHT, peerId string) err {
// 	// remove from local storage
// }

// TODO get all available files -- idea: make a key whose value is purely for contributing file metadata
// another idea: go look at kubo

// TODO reconcile conflicting file names, modified, etc
// For now, just accept teh first node to upload a file as complete truth

// TODO removing files from dht
