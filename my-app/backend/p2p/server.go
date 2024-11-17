package p2p

import (
	"net/http"

	gostream "github.com/libp2p/go-libp2p-gostream"

	"github.com/libp2p/go-libp2p/core/host"
)

type FileService struct{}
type Arg struct {
	file string
}

func httpserver(server_node host.Host) error {
	listener, _ := gostream.Listen(server_node, "/mock-http/1.0.0")
	defer listener.Close()
	http.Handle("/", http.FileServer(http.Dir("../uploaded_files")))

	http.Serve(listener, nil)
}
