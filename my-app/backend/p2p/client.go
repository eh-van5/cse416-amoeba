package p2p

import (
	"fmt"
	"io"
	"net/http"
	"os"

	p2phttp "github.com/libp2p/go-libp2p-http"
	"github.com/libp2p/go-libp2p/core/host"
)

func httpclient(client_node host.Host, peerid string, hash string) {
	tr := &http.Transport{}
	tr.RegisterProtocol("libp2p", p2phttp.NewTransport(client_node))
	client := &http.Client{Transport: tr}

	res, err := client.Get("libp2p://" + peerid + "/hello")
	if err != nil {
		fmt.Println("Error fetching file:", err)
		return
	}
	defer res.Body.Close()

	// Create a file to save the downloaded data
	outFile, err := os.Create(hash)
	if err != nil {
		fmt.Println("Error creating file:", err)
		return
	}
	defer outFile.Close()

	// Write the file contents to disk
	_, err = io.Copy(outFile, res.Body)
	if err != nil {
		fmt.Println("Error saving file:", err)
		return
	}

	fmt.Println("File downloaded successfully!")
}
