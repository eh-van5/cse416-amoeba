package fshare

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
)

// HTTP COMMS WITH FRONTEND
func GetProviders(ctx context.Context, dht *dht.IpfsDHT, node host.Host, filedb *KV) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		contentHash := r.URL.Query().Get("contentHash")
		fmt.Println(contentHash)
		if contentHash == "" {
			http.Error(w, "Missing contentHash", http.StatusBadRequest)
			return
		}

		providers, err := GetProvidersHelper(ctx, dht, contentHash)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		fmt.Println(providers)
		var hostToFileinfo = make(map[string]FileInfo)

		for _, peer := range providers {
			fmt.Println("sending data to " + peer.ID.String())
			if peer.ID.String() == node.ID().String() {
				fileinfo, err := filedb.GetFileInfo(contentHash)
				fmt.Println(*fileinfo)
				if err == nil {
					hostToFileinfo[node.ID().String()] = *fileinfo
				}
				continue
			}
			peerFileInfo, err := WantFileMetadata(node, peer.ID.String(), contentHash)
			if err != nil {
				continue
			}
			fmt.Println(peerFileInfo)

			hostToFileinfo[peer.ID.String()] = peerFileInfo
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(hostToFileinfo)
	}
}

func ProvideFile(ctx context.Context, dht *dht.IpfsDHT, filedb *KV) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err := r.ParseMultipartForm(60 << 32)
		if err != nil {
			http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
			return
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		filename := r.FormValue("filename")
		filesize, err := strconv.Atoi(r.FormValue("filesize"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		filetype := r.FormValue("filetype")
		lastmodified, err := strconv.Atoi(r.FormValue("lastmodified"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		price, err := strconv.Atoi(r.FormValue("price"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		fmt.Println("read file stuff")
		fileContent, err := io.ReadAll(file)
		if err != nil {
			http.Error(w, "Error reading file content", http.StatusInternalServerError)
			return
		}

		fileInfo := FileInfo{
			Price:        price,
			Name:         filename,
			Size:         filesize,
			FileType:     filetype,
			LastModified: lastmodified,
		}

		err = ProvideFileHelper(ctx, dht, filedb, fileInfo, fileContent)
		if err != nil {
			http.Error(w, "Providing files", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func GetUserFiles(filesdb *KV) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		files, err := filesdb.GetAllFiles()
		if err != nil {
			http.Error(w, "Providing files", http.StatusInternalServerError)
			return
		}
		fmt.Println(files)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(files)
	}
}
