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

type FileInfo struct {
	Price    int
	FileMeta FileMetadata
}

type FileMetadata struct {
	Name     string
	Size     int
	FileType string
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

func storeFileInfo(ctx context.Context, dht *dht.IpfsDHT, contentHash string, price int, data FileMetadata) error {
	dhtKey := "/orcanet/" + dht.PeerID().String()
	existingValue, err := dht.GetValue(ctx, dhtKey)
	var priceInfo map[string]FileInfo
	if err == nil {
		// decode existing provider list if found
		err = json.Unmarshal(existingValue, &priceInfo)
		if err != nil {
			return fmt.Errorf("failed to decode existing providers: %v", err)
		}
	} else {
		priceInfo = make(map[string]FileInfo)
	}

	priceInfo[contentHash] = FileInfo{Price: price, FileMeta: data}
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

func ProvideFileHelper(ctx context.Context, dht *dht.IpfsDHT, filename string, filesize int, price int, fileContent []byte) error {
	fmt.Println("providing a file")
	c, err := generateContentHash(fileContent)
	if err != nil {
		return fmt.Errorf("failed to generate cid: %v", err)
	}

	dhtKey := "/orcanet/" + c.String()
	fileType := http.DetectContentType(fileContent)

	fileMeta := FileMetadata{
		Name:     filename,
		Size:     filesize,
		FileType: fileType,
	}

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

	fileMetaBytes, err := json.Marshal(fileMeta)
	if err != nil {
		return fmt.Errorf("failed to encode file info: %v", err)
	}

	// store the updated provider list in the DHT
	err = dht.PutValue(ctx, dhtKey, fileMetaBytes)
	if err != nil {
		return fmt.Errorf("failed to store provider info in DHT: %v", err)
	}

	storeFileInfo(ctx, dht, c.String(), price, fileMeta)
	// provide file
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}

	fmt.Println("hash: ", c.String())
	uploadFile(fileContent, c.String())

	return nil
}

func GetProvidersHelper(ctx context.Context, dht *dht.IpfsDHT, contentHash string) (map[string]FileInfo, error) {

	// findProviders
	// query each provider for the file price, if there isn't don't add it in
	// provide providers and, put the file price in the node's key
	priceMap := make(map[string]FileInfo)

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
		fmt.Println(pricesBytes)
		var prices map[string]FileInfo
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

func PauseProvide(ctx context.Context, dht *dht.IpfsDHT, contentHash string) error {
	dhtKey := "/orcanet/" + dht.PeerID().String()
	fmt.Println("Peer key ", dhtKey)

	existingValue, err := dht.GetValue(ctx, dhtKey)
	var priceInfo map[string]FileInfo
	if err == nil {
		// decode existing provider list if found
		err = json.Unmarshal(existingValue, &priceInfo)
		if err != nil {
			return fmt.Errorf("failed to decode existing providers: %v", err)
		}
		delete(priceInfo, contentHash)
	} else {
		priceInfo = make(map[string]FileInfo)
	}

	priceInfoBytes, err := json.Marshal(priceInfo)
	if err != nil {
		return fmt.Errorf("failed to encode file info: %v", err)
	}

	err = dht.PutValue(ctx, dhtKey, priceInfoBytes)
	if err != nil {
		return fmt.Errorf("failed to store provider info in DHT: %v", err)
	}

	return nil
}

func StopProvide(ctx context.Context, dht *dht.IpfsDHT, contentHash string) error {
	PauseProvide(ctx, dht, contentHash)
	err := os.Remove("../userFiles/" + contentHash)
	if err != nil {
		return fmt.Errorf("failed to remove file from DHT: %v", err)
	}
	return nil
}

// TODO get all available files -- idea: make a key whose value is purely for contributing file metadata
// another idea: go look at kubo

// TODO reconcile conflicting file names, modified, etc
// For now, just accept teh first node to upload a file as complete truth
