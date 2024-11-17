package dht

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"

	cid "github.com/ipfs/go-cid"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multihash"
)

type FileProvider struct {
	PeerId peer.ID
	Price  int
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

func ProvideKey(ctx context.Context, dht *dht.IpfsDHT, filePath string, price int) error {
	// Read file content
	fileContent, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %v", err)
	}

	// Generate CID from file content
	hash := sha256.Sum256(fileContent)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return fmt.Errorf("error encoding multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)

	dhtKey := "/orcanet/" + c.String()

	// check if there are prev providers for this file
	var providers []FileProvider
	existingValue, err := dht.GetValue(ctx, dhtKey)
	if err == nil {
		// Decode existing provider list if found
		err = json.Unmarshal(existingValue, &providers)
		if err != nil {
			return fmt.Errorf("failed to decode existing providers: %v", err)
		}
	}

	// add the new provider info
	newProvider := FileProvider{
		PeerId: dht.PeerID(),
		Price:  price,
	}

	providers = append(providers, newProvider)

	// serialize the updated provider list to JSON
	providerData, err := json.Marshal(providers)
	if err != nil {
		return fmt.Errorf("failed to encode providers: %v", err)
	}

	// store the updated provider list in the DHT
	err = dht.PutValue(ctx, dhtKey, providerData)
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
