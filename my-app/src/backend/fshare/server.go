package fshare

import (
	"net/http"

	gostream "github.com/libp2p/go-libp2p-gostream"

	"github.com/libp2p/go-libp2p/core/host"
)

func HttpServer(server_node host.Host) {
	listener, _ := gostream.Listen(server_node, "/get-file")
	defer listener.Close()
	http.Handle("/", http.FileServer(http.Dir("../uploaded_files")))

	http.Serve(listener, nil)
}
