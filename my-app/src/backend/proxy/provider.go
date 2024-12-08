package proxy

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/elazarl/goproxy"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/p2p/net/gostream"
)

func startProxyNode(node host.Host) (net.Listener, error) {
	listener, err := gostream.Listen(node, "/amoeba-proxy/1.0.0")
	if err != nil {
		return nil, fmt.Errorf("failed to create gostream listener: %w", err)
	}

	log.Println("Proxy node is ready, waiting for connections...")

	// Get a new goproxy instance
	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = true

	// Handle HTTPS
	proxy.OnRequest().HandleConnectFunc(func(host string, ctx *goproxy.ProxyCtx) (*goproxy.ConnectAction, string) {
		log.Printf("Proxy node handling CONNECT request for host: %s", host)

		conn, err := net.Dial("tcp", host)
		if err != nil {
			log.Printf("Failed to connect to target server %s: %v", host, err)
			return goproxy.RejectConnect, ""
		}

		proxyStatusCache.activeConns.Store(conn, true)

		ctx.UserData = conn
		return goproxy.OkConnect, host
	})

	// Handle HTTP
	proxy.OnRequest().DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		log.Printf("Proxying HTTP request: %s %s", req.Method, req.URL)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			log.Printf("Error forwarding request: %v", err)
			return nil, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusBadGateway, "Failed to forward request")
		}

		return nil, resp
	})

	go func() {
		server := &http.Server{Handler: proxy}

		log.Println("Proxy server is running...")
		err := server.Serve(listener)
		if err != nil {
			if errors.Is(err, http.ErrServerClosed) || strings.Contains(err.Error(), "context canceled") {
				log.Println("Proxy server stopped gracefully.")
			} else {
				log.Printf("Proxy server error: %v", err)
			}
		}
	}()

	return listener, nil
}

func storeProxyInfo(ctx context.Context, dht *dht.IpfsDHT, proxyInfo ProxyInfo, peerID string) error {
	key := "proxy/" + peerID
	proxyKey := "/orcanet/" + key
	value, err := json.Marshal(proxyInfo)
	if err != nil {
		return fmt.Errorf("failed to marshal proxy info: %w", err)
	}

	// Store in DHT
	err = dht.PutValue(ctx, proxyKey, value)
	if err != nil {
		return fmt.Errorf("failed to store proxy info in DHT: %w", err)
	}

	// Set node as the key provider
	if err := provideKey(ctx, dht, key); err != nil {
		return fmt.Errorf("failed to provide proxy key: %w", err)
	}

	return nil
}

func EnableProxyHandler(ctx context.Context, dht *dht.IpfsDHT, node host.Host) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxyStatusCache.Lock()
		defer proxyStatusCache.Unlock()

		if proxyStatusCache.isProxyEnabled {
			http.Error(w, "Proxy is already enabled", http.StatusBadRequest)
			return
		}

		var proxyInfo ProxyInfo
		err := json.NewDecoder(r.Body).Decode(&proxyInfo)
		if err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		ip, err := getPublicIP()
		if err != nil {
			http.Error(w, "Failed to retrieve public IP", http.StatusInternalServerError)
			return
		}

		listener, err := startProxyNode(node)
		if err != nil {
			http.Error(w, fmt.Sprintf("Proxy node error: %v", err), http.StatusInternalServerError)
			return
		}

		peerID := node.ID().String()
		proxyInfo.IPAddress = ip
		proxyInfo.Status = "available"
		proxyInfo.LastActive = time.Now()
		proxyInfo.PeerID = peerID

		err = storeProxyInfo(ctx, dht, proxyInfo, peerID)
		if err != nil {
			listener.Close()
			http.Error(w, "Failed to enable proxy", http.StatusInternalServerError)
			return
		}

		proxyStatusCache.isProxyEnabled = true
		proxyStatusCache.listener = listener

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "Proxy Enabled"})
		log.Println("Proxy service enabled and advertised in DHT")
	}
}

func DisableProxyHandler(ctx context.Context, dht *dht.IpfsDHT, node host.Host) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxyStatusCache.Lock()
		defer proxyStatusCache.Unlock()

		if !proxyStatusCache.isProxyEnabled {
			http.Error(w, "Proxy is not enabled", http.StatusBadRequest)
			return
		}

		peerID := node.ID().String()
		key := "/orcanet/proxy/" + peerID

		err := dht.PutValue(ctx, key, nil)
		if err != nil {
			http.Error(w, "Failed to disable proxy", http.StatusInternalServerError)
			return
		}

		log.Println("Closing active connections...")
		proxyStatusCache.activeConns.Range(func(key, value interface{}) bool {
			conn := key.(net.Conn)
			conn.Close()
			return true
		})

		proxyStatusCache.activeConns = sync.Map{}

		// Stop HTTP service
		if proxyStatusCache.listener != nil {
			log.Println("Stopping proxy node listener...")
			if err := proxyStatusCache.listener.Close(); err != nil {
				log.Printf("Error stopping listener: %v", err)
			} else {
				log.Println("Proxy node listener stopped successfully.")
			}
			proxyStatusCache.listener = nil
		}

		proxyStatusCache.isProxyEnabled = false

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "Proxy Disabled"})
		log.Println("Proxy service disabled and removed from DHT")
	}
}
