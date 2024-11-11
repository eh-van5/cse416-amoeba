package files

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
	peerId peer.ID
	price  int
}

func ProvideKey(ctx context.Context, dht *dht.IpfsDHT, filePath string, fileName string, price int) error {
	fileContent, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Printf("Failed to get file: %v\n", err)
		return err
	}

	if err != nil {
		fmt.Printf("Failed to put record: %v\n", err)
		return err
	}

	data := []byte(fileContent)
	hash := sha256.Sum256(data)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return fmt.Errorf("error encoding multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)
	existingValue, err := dht.GetValue(ctx, c.String())
	var providers []FileProvider

	if err == nil {
		err = json.Unmarshal(existingValue, &providers)
		if err != nil {
			return fmt.Errorf("failed to decode existing providers: %v", err)
		}
	}

	newProvider := FileProvider{
		peerId: dht.PeerID(),
		price:  price,
	}

	providers = append(providers, newProvider)
	providerData, err := json.Marshal(providers)

	if err != nil {
		return fmt.Errorf("failed to encode providers: %v", err)
	}

	err = dht.PutValue(ctx, c.String(), providerData)

	if err != nil {
		return fmt.Errorf("failed to store provider info in DHT: %v", err)
	}

	// Start providing the key
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}
	return nil
}
