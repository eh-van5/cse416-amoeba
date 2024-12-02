package proxy

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/elazarl/goproxy"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/p2p/net/gostream"
)

func startProxyNode(node host.Host) net.Listener {
	listener, err := gostream.Listen(node, "/amoeba-proxy/1.0.0")
	if err != nil {
		log.Fatalf("Failed to create gostream listener: %v", err)
	}

	log.Println("Proxy node is ready, waiting for connections...")

	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = true

	// For HTTPS
	proxy.OnRequest().HandleConnectFunc(func(host string, ctx *goproxy.ProxyCtx) (*goproxy.ConnectAction, string) {
		log.Printf("Proxy node handling CONNECT request for host: %s", host)

		conn, err := net.Dial("tcp", host)
		if err != nil {
			log.Printf("Failed to connect to target server %s: %v", host, err)
			return goproxy.RejectConnect, ""
		}

		ctx.UserData = conn
		return goproxy.OkConnect, host
	})

	proxy.OnRequest().DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		log.Printf("Proxying HTTP request: %s %s", req.Method, req.URL)

		client := &http.Client{}

		newReq, err := http.NewRequest(req.Method, req.URL.String(), req.Body)
		if err != nil {
			log.Printf("Failed to create new request: %v", err)
			return nil, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusInternalServerError, "Failed to create request")
		}

		newReq.Header = req.Header

		resp, err := client.Do(newReq)
		if err != nil {
			log.Printf("Error forwarding request: %v", err)
			return nil, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusBadGateway, "Failed to forward request")
		}

		return nil, resp
	})

	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				log.Printf("Failed to accept connection: %v", err)
				return
			}

			go func(c net.Conn) {
				defer c.Close()
				http.Serve(&singleConnListener{c}, proxy)
			}(conn)
		}
	}()

	return listener
}

type singleConnListener struct {
	net.Conn
}

func (l *singleConnListener) Accept() (net.Conn, error) {
	return l.Conn, nil
}

func (l *singleConnListener) Close() error {
	return l.Conn.Close()
}

func (l *singleConnListener) Addr() net.Addr {
	return l.Conn.LocalAddr()
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
		var proxyInfo ProxyInfo

		err := json.NewDecoder(r.Body).Decode(&proxyInfo)
		if err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		/* ip, err := getPublicIP()
		if err != nil {
			http.Error(w, "Failed to retrieve public IP", http.StatusInternalServerError)
			return
		} */

		listener := startProxyNode(node)

		peerID := node.ID().String()
		proxyInfo.IPAddress = peerID
		proxyInfo.Status = "available"
		proxyInfo.LastActive = time.Now()

		err = storeProxyInfo(ctx, dht, proxyInfo, peerID)
		if err != nil {
			http.Error(w, "Failed to enable proxy", http.StatusInternalServerError)
			return
		}

		proxyStatusCache.Lock()
		proxyStatusCache.isProxyEnabled = true
		proxyStatusCache.listener = listener
		proxyStatusCache.Unlock()

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
