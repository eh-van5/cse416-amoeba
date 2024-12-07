package fshare

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"

	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/rs/cors"
)

func HttpSetup(ctx context.Context, dht *dht.IpfsDHT) {
	mux := http.NewServeMux()
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	mux.HandleFunc("/getFile", GetProviders(ctx, dht))
	mux.HandleFunc("/uploadFile", ProvideFile(ctx, dht))

	PORT := 8000
	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", PORT),
		Handler: handler,
	}

	go func() {
		err := httpServer.ListenAndServe()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()
}
