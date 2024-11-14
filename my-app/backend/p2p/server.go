package p2p

import (
	"net/http"

	gostream "github.com/libp2p/go-libp2p-gostream"
	"github.com/libp2p/go-libp2p/core/host"
)

func server(server_node host.Host) {
	listener, _ := gostream.Listen(server_node, p2phttp.DefaultP2PProtocol)
	defer listener.Close()
	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hi!"))
	})
	server := &http.Server{}
	server.Serve(listener)
}
