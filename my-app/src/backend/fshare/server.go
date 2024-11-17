package fshare

import (
	"fmt"
	"net/http"
	"path/filepath"

	gostream "github.com/libp2p/go-libp2p-gostream"

	"github.com/libp2p/go-libp2p/core/host"
)

func HttpServer(server_node host.Host) {
	listener, _ := gostream.Listen(server_node, "/get-file")
	defer listener.Close()
	fmt.Println(filepath.Abs("../userFiles"))
	http.Handle("/", http.FileServer(http.Dir("../userFiles")))

	http.Serve(listener, nil)
}

// TODO bitcoin transactions
