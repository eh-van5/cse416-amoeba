package proxy

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"strings"

	"github.com/elazarl/goproxy"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/p2p/net/gostream"
)

var localHTTPProxy *http.Server
var httpProxyListener net.Listener

func startClientNode(node host.Host) {
	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = true

	proxy.OnRequest().HandleConnect(goproxy.FuncHttpsHandler(func(host string, ctx *goproxy.ProxyCtx) (*goproxy.ConnectAction, string) {
		log.Printf("Handling CONNECT request for host: %s", host)

		// Create a stream to the proxy node
		conn, err := gostream.Dial(network.WithAllowLimitedConn(context.Background(), "/amoeba-proxy/1.0.0"), node, proxyStatusCache.activeProxyPeer, "/amoeba-proxy/1.0.0")
		if err != nil {
			log.Printf("Failed to connect to proxy node: %v", err)
			return goproxy.RejectConnect, ""
		}
		defer conn.Close()

		// Returns transparent forwarding instructions
		ctx.UserData = conn
		return goproxy.OkConnect, host
	}))

	proxy.OnRequest().DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		log.Printf("Proxying request: %s %s", req.Method, req.URL)

		conn, err := gostream.Dial(network.WithAllowLimitedConn(context.Background(), "/amoeba-proxy/1.0.0"), node, proxyStatusCache.activeProxyPeer, "/amoeba-proxy/1.0.0")
		if err != nil {
			log.Printf("Failed to connect to proxy node: %v", err)
			return nil, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusBadGateway, "Failed to connect to proxy node")
		}
		defer conn.Close()

		// Write the HTTP request to the P2P connection
		err = req.Write(conn)
		if err != nil {
			log.Printf("Error writing request to stream: %v", err)
			return nil, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusBadGateway, "Failed to connect to proxy node")
		}

		// Read the HTTP response from the P2P connection
		resp, err := http.ReadResponse(bufio.NewReader(conn), req)
		if err != nil {
			log.Printf("Error reading response from stream: %v", err)
			return nil, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusBadGateway, "Failed to receive response from proxy node")
		}

		return nil, resp
	})

	listener, err := net.Listen("tcp", "127.0.0.1:8888")
	if err != nil {
		log.Fatalf("Failed to start HTTP proxy: %v", err)
	}
	httpProxyListener = listener

	// Start a local HTTP Proxy Server
	server := &http.Server{
		Handler: proxy,
	}
	localHTTPProxy = server

	log.Println("Starting local HTTP proxy on 127.0.0.1:8888")
	if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
		log.Printf("HTTP proxy server stopped with error: %v", err)
	}
}

func UseProxyHandler(node host.Host) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var requestData struct {
			TargetPeerID string `json:"targetPeerID"`
		}

		// Decode target peer ID from the request
		if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		// Validate and decode the target peer ID
		targetPeerID := strings.TrimSpace(requestData.TargetPeerID)
		if targetPeerID == "" {
			http.Error(w, "Target peer ID is required", http.StatusBadRequest)
			return
		}

		targetPeer, err := peer.Decode(targetPeerID)
		if err != nil {
			http.Error(w, "Invalid target Peer ID", http.StatusBadRequest)
			return
		}
		proxyStatusCache.Lock()
		defer proxyStatusCache.Unlock()

		if proxyStatusCache.isUsingProxy {
			http.Error(w, "Proxy is already in use", http.StatusBadRequest)
			return
		}

		go startClientNode(node)

		proxyStatusCache.isUsingProxy = true
		proxyStatusCache.activeProxyPeer = targetPeer

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "Using Proxy Node"})
	}
}

func StopUsingProxyHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxyStatusCache.Lock()
		defer proxyStatusCache.Unlock()

		if !proxyStatusCache.isUsingProxy {
			http.Error(w, "Proxy is not in use", http.StatusBadRequest)
			return
		}

		if localHTTPProxy != nil {
			log.Println("Shutting down local HTTP proxy...")
			if err := localHTTPProxy.Close(); err != nil && !errors.Is(err, http.ErrServerClosed) {
				log.Printf("Error shutting down HTTP proxy: %v", err)
			}
			localHTTPProxy = nil
		}

		if httpProxyListener != nil {
			log.Println("Closing HTTP proxy listener...")
			err := httpProxyListener.Close()
			if err != nil && !strings.Contains(err.Error(), "use of closed network connection") {
				log.Printf("Error closing HTTP proxy listener: %v", err)
			} else {
				log.Println("HTTP proxy listener closed successfully.")
			}
			httpProxyListener = nil
		}

		proxyStatusCache.isUsingProxy = false
		proxyStatusCache.activeProxyPeer = peer.ID("")

		log.Println("Client stopped using proxy")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "Stopped Using Proxy"})
	}
}
