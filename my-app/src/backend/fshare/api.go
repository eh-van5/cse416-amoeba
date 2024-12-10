package fshare

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	dht "github.com/libp2p/go-libp2p-kad-dht"
)

func GetProviders(ctx context.Context, dht *dht.IpfsDHT) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		contentHash := r.URL.Query().Get("contentHash")
		if contentHash == "" {
			http.Error(w, "Missing contentHash", http.StatusBadRequest)
			return
		}

		providers, err := GetProvidersHelper(ctx, dht, contentHash)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(providers)
	}
}

func ProvideFile(ctx context.Context, dht *dht.IpfsDHT) http.HandlerFunc {
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

		err = ProvideFileHelper(ctx, dht, filename, filesize, price, fileContent)
		if err != nil {
			http.Error(w, "Providing files", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
