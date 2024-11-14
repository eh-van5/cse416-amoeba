package p2p

import (
	"net/http"

	gostream "github.com/libp2p/go-libp2p-gostream"

	"github.com/libp2p/go-libp2p/core/host"
)

func httpserver(server_node host.Host) error {
	listener, _ := gostream.Listen(server_node, "/mock-http/1.0.0")
	defer listener.Close()
	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hi!"))
	})
	return http.Serve(listener, nil)
}
