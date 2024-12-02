package proxy

import (
	"net"
	"sync"
	"time"

	"github.com/libp2p/go-libp2p/core/peer"
)

// ProxyInfo represents the information for a proxy node.
type ProxyInfo struct {
	IPAddress  string    `json:"ipAddress"`
	PricePerMB float64   `json:"pricePerMB"`
	Status     string    `json:"status"`
	LastActive time.Time `json:"lastActive"`
}

// ProxyStatusCache holds the shared status for proxies.
var ProxyStatusCache struct {
	sync.RWMutex
	IsProxyEnabled  bool
	IsUsingProxy    bool
	Listener        net.Listener
	ActiveProxyPeer peer.ID
}
