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
	return nil
}

func GetProviders(ctx context.Context, dht *dht.IpfsDHT, contentHash string) ([]byte, error) {
	res, err := dht.GetValue(ctx, contentHash)
	if err != nil {
		fmt.Printf("Failed to get record: %v\n", err)
		return res, err
	}
	return res, nil
}

func GetPeerAddr(ctx context.Context, dht *dht.IpfsDHT, peerId peer.ID) (peer.AddrInfo, error) {
	res, err := dht.FindPeer(ctx, peerId)
	if err != nil {
		fmt.Printf("Failed to get peer: %v\n", err)
		return res, err
	}
	return res, err
}
