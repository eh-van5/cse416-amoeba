package fshare

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

func uploadFile(fileContent []byte, hash string) error {
	// Create a temporary file within our temp-images directory that follows
	// a particular naming pattern
	copy, err := os.Create("../userFiles/" + hash)
	if err != nil {
		return err
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
	return nil
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

func ProvideFileHelper(
	ctx context.Context,
	dht *dht.IpfsDHT,
	fileDb *KV,
	fileInfo FileInfo,
	fileContent []byte) error {

	c, err := generateContentHash(fileContent)
	if err != nil {
		return fmt.Errorf("failed to generate cid: %v", err)
	}

	dhtKey := "/orcanet/" + c.String()
	fileInfo.Hash = c.String()

	fileDb.SetFileInfo(c.String(), fileInfo)

	fileInfoBytes, err := json.Marshal(fileInfo)
	if err != nil {
		return fmt.Errorf("failed to encode file info: %v", err)
	}

	err = dht.PutValue(ctx, dhtKey, fileInfoBytes)
	if err != nil {
		return fmt.Errorf("failed to store provider info in DHT: %v", err)
	}

	// provide file
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}

	uploadFile(fileContent, c.String())

	return nil
}

func GetProvidersHelper(ctx context.Context, dht *dht.IpfsDHT, contentHash string) ([]peer.AddrInfo, error) {
	// findProviders

	cid, err := cid.Decode(contentHash)
	if err != nil {
		return nil, fmt.Errorf("error decoding CID %v", err)
	}

	providers, err := dht.FindProviders(ctx, cid)
	if err != nil {
		return nil, fmt.Errorf("error getting providers %v", err)
	}

	return providers, nil
}

func RefreshProviderRecordsHelper(ctx context.Context, dht *dht.IpfsDHT, filesDB *KV) error {
	hashes, err := filesDB.GetAllContentHashes()
	// fmt.Println(hashes)
	if err != nil {
		return err
	}
	for _, hash := range hashes {
		fileInfo, err := filesDB.GetFileInfo(hash)
		if err != nil {
			return fmt.Errorf("failed to encode file info: %v", err)
		}

		fileInfoBytes, err := json.Marshal(fileInfo)
		if err != nil {
			return fmt.Errorf("failed to encode file info: %v", err)
		}

		dhtKey := "/orcanet/" + hash

		err = dht.PutValue(ctx, dhtKey, fileInfoBytes)
		if err != nil {
			return fmt.Errorf("failed to store provider info in DHT: %v", err)
		}

		c, err := cid.Decode(hash)
		if err != nil {
			return err
		}

		err = dht.Provide(ctx, c, true)
		if err != nil {
			return err
		}
	}

	err = MakeDiscoverable(ctx, dht)
	if err != nil {
		return err
	}

	return nil
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

func MakeDiscoverable(ctx context.Context, dht *dht.IpfsDHT) error {
	dhtKey := "/orcanet/peer-discovery"

	err := dht.PutValue(ctx, dhtKey, []byte(""))
	if err != nil {
		return fmt.Errorf("failed to store provider info in DHT: %v", err)
	}

	c, err := generateContentHash([]byte(dhtKey))
	if err != nil {
		return fmt.Errorf("failed to generate content hash: %v", err)
	}

	// provide file
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}

	return nil
}

// TODO get all available files -- idea: make a key whose value is purely for contributing file metadata
// another idea: go look at kubo

// TODO reconcile conflicting file names, modified, etc
// For now, just accept teh first node to upload a file as complete truth
