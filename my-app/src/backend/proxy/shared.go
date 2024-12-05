package proxy

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/ipfs/go-cid"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multihash"
)

// ProxyInfo represents the information for a proxy node.
type ProxyInfo struct {
	IPAddress  string    `json:"ipAddress"`
	PricePerMB float64   `json:"pricePerMB"`
	Status     string    `json:"status"`
	LastActive time.Time `json:"lastActive"`
	PeerID     string    `json:"peerID"`
}

// ProxyStatusCache holds the shared status for proxies.
var proxyStatusCache struct {
	sync.RWMutex
	isProxyEnabled  bool
	isUsingProxy    bool
	listener        net.Listener
	activeConns     sync.Map
	activeProxyPeer peer.ID
}

func provideKey(ctx context.Context, dht *dht.IpfsDHT, key string) error {
	data := []byte(key)
	hash := sha256.Sum256(data)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return fmt.Errorf("error encoding multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)

	// Start providing the key
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}
	return nil
}
