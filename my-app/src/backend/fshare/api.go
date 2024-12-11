package fshare

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
)

// HTTP COMMS WITH FRONTEND
func GetProviders(ctx context.Context, dht *dht.IpfsDHT, node host.Host, filedb *KV) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		contentHash := r.URL.Query().Get("contentHash")
		// fmt.Println(contentHash)
		contentHash = strings.TrimSpace(contentHash)
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
				fmt.Println("QUERYING YOURSELF")
				fileinfo, err := filedb.GetFileInfo(contentHash)
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

func ProvideFile(ctx context.Context, dht *dht.IpfsDHT, filesdb *KV) http.HandlerFunc {
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

		err = ProvideFileHelper(ctx, dht, filesdb, fileInfo, fileContent)
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
		// fmt.Println(files)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(files)
	}
}

func BuyFile(ctx context.Context, node host.Host) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		targetpeerid := r.FormValue("targetpeerid")
		hash := r.FormValue("hash")
		filename := r.FormValue("filename")
		err := StartHttpClient(ctx, node, targetpeerid, hash, filename)
		if err != nil {
			http.Error(w, "getting files", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

func StopProvide(ctx context.Context, dht *dht.IpfsDHT, filesdb *KV) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		hash := r.FormValue("hash")
		hash = strings.TrimSpace(hash)
		err := filesdb.DeleteFileInfo(hash)
		if err != nil {
			fmt.Println(err)
			http.Error(w, "deleting files from db", http.StatusInternalServerError)
			return
		}
		err = os.Remove("../userFiles/" + hash)
		if err != nil {
			http.Error(w, "deleting files from folder", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

func ExploreKNeighbors(ctx context.Context, dht *dht.IpfsDHT, node host.Host) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		k, err := strconv.Atoi(r.URL.Query().Get("K"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		peerIds, err := dht.GetClosestPeers(ctx, node.ID().String())
		if err != nil {
			http.Error(w, "Can't get closest peers", http.StatusNotFound)
			return
		}
		var hashToMetadata = make(map[string]FileInfo)
		for index, peerId := range peerIds {
			// fmt.Println("sending data to " + peerId.String())
			if index == k+1 {
				break
			}
			if peerId.String() == node.ID().String() {
				continue
			}
			peerFilesInfo, err := WantAllFileMetadata(node, peerId.String())
			if err != nil {
				continue
			}
			fmt.Println("peerFilesInfo: ", peerFilesInfo)
			for _, fileInfo := range peerFilesInfo {
				hashToMetadata[fileInfo.Hash] = fileInfo
			}
		}

		files := []FileInfo{}
		for _, file := range hashToMetadata {
			files = append(files, file)
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(files)
	}
}
