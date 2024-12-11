package proxy

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sync/atomic"
	"time"

	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
)

func GetAvailableProxiesHandler(ctx context.Context, dht *dht.IpfsDHT, node host.Host) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		availableProxies := listAllProxies(ctx, node, dht)

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(availableProxies)
	}
}

func getPublicIP() (string, error) {
	resp, err := http.Get("https://api.ipify.org?format=text")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	ip, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(ip), nil
}

func EnableCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}

func listAllProxies(ctx context.Context, node host.Host, dht *dht.IpfsDHT) []ProxyInfo {
	proxyInfos := []ProxyInfo{}
	myID := node.ID().String()

	for _, peer := range node.Peerstore().Peers() {
		peerID := peer.String()
		if peerID == myID {
			continue
		}
		key := "/orcanet/proxy/" + peerID
		value, err := dht.GetValue(ctx, key)
		if err != nil {
			continue
		}

		var proxyInfo ProxyInfo
		err = json.Unmarshal(value, &proxyInfo)
		if err != nil {
			log.Printf("Failed to unmarshal proxy info for key %s: %v", key, err)
			continue
		}

		if proxyInfo.Status == "available" {
			proxyInfos = append(proxyInfos, proxyInfo)
		}
	}

	return proxyInfos
}

/* Heartbeat */
func HeartbeatHandler(dht *dht.IpfsDHT, peerID string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := context.Background()
		key := "/orcanet/proxy/" + peerID

		value, err := dht.GetValue(ctx, key)
		if err != nil {
			log.Printf("Failed to find proxy info for heartbeat: %v", err)
			http.Error(w, "Proxy not found", http.StatusNotFound)
			return
		}

		var proxyInfo ProxyInfo
		if err := json.Unmarshal(value, &proxyInfo); err != nil {
			log.Printf("Failed to unmarshal proxy infor for heartbeat: %v", err)
			http.Error(w, "Failed to parse proxy info", http.StatusInternalServerError)
			return
		}

		proxyInfo.LastActive = time.Now()
		newValue, err := json.Marshal(proxyInfo)
		if err != nil {
			log.Printf("Failed to marshal proxy info for heartbeat: %v", err)
			http.Error(w, "Failed to update proxy info", http.StatusInternalServerError)
			return
		}

		if err := dht.PutValue(ctx, key, newValue); err != nil {
			log.Printf("Failed to store updated proxy info for heartbeat: %v", err)
			http.Error(w, "Failed to store updated proxy info", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Heartbeat received"))
	}
}

/* Proxy node Status */

func MonitorProxyStatus(node host.Host, dht *dht.IpfsDHT) {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	ctx := context.Background()
	peerID := node.ID().String()
	key := "/orcanet/proxy/" + peerID

	for {
		<-ticker.C

		// Check self proxy node status
		value, err := dht.GetValue(ctx, key)
		if err != nil || value == nil {
			proxyStatusCache.Lock()
			proxyStatusCache.isProxyEnabled = false
			proxyStatusCache.Unlock()
			continue
		}

		proxyStatusCache.Lock()
		proxyStatusCache.isProxyEnabled = true
		proxyStatusCache.Unlock()

		// Check all other proxy nodes' status
		for _, peer := range node.Peerstore().Peers() {
			pID := peer.String()
			key := "/orcanet/proxy/" + pID
			value, err := dht.GetValue(ctx, key)
			if err != nil {
				continue
			}

			var proxyInfo ProxyInfo
			err = json.Unmarshal(value, &proxyInfo)
			if err != nil {
				log.Printf("Failed to unmarshal proxy info for key %s: %v", key, err)
				continue
			}

			if proxyInfo.Status == "available" && time.Since(proxyInfo.LastActive) > 12*time.Second {
				if err := dht.PutValue(ctx, key, nil); err != nil {
					log.Printf("Failed to store updated proxy info for key %s: %v", key, err)
				}
				proxyStatusCache.isProxyEnabled = false
				log.Printf("Proxy %s is deleted due to inactivity", proxyInfo.IPAddress)
			}
		}
	}
}

func ProxyStatusHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxyStatusCache.RLock()
		defer proxyStatusCache.RUnlock()

		status := map[string]interface{}{
			"isProxyEnabled": proxyStatusCache.isProxyEnabled,
			"isUsingProxy":   proxyStatusCache.isUsingProxy,
			"dataSent":       atomic.LoadUint64(&proxyStatusCache.dataSent),
			"dataRecv":       atomic.LoadUint64(&proxyStatusCache.dataRecv),
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(status)
	}
}
