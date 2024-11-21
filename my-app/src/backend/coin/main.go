package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/rpcclient"
	"github.com/btcsuite/btcd/wire"
	"github.com/eh-van5/cse416-amoeba/api"
	"github.com/eh-van5/cse416-amoeba/server"
)

func main() {
	name := "Colony"

	ntfnHandlers := rpcclient.NotificationHandlers{
		OnFilteredBlockConnected: func(height int32, header *wire.BlockHeader, txns []*btcutil.Tx) {
			log.Printf("Block connected: %v (%d) %v",
				header.BlockHash(), height, header.Timestamp)
		},
		OnFilteredBlockDisconnected: func(height int32, header *wire.BlockHeader) {
			log.Printf("Block disconnected: %v (%d) %v",
				header.BlockHash(), height, header.Timestamp)
		},
	}

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	btcdDone := make(chan bool)
	walletDone := make(chan bool)
	defer cancel()

	// Starts btcd process
	server.StartBtcd(ctx, btcdDone, "")
	// Wait for btcd to start
	time.Sleep(3 * time.Second)

	// Starts btcwallet
	server.StartWallet(ctx, walletDone, "pass2")
	// Wait for btcwallet to start
	time.Sleep(3 * time.Second)

	// // btcd configurations
	// connCfg := &rpcclient.ConnConfig{
	// 	Host:       "localhost:8334",
	// 	Endpoint:   "ws",
	// 	User:       "user",
	// 	Pass:       "password",
	// 	DisableTLS: true,
	// }

	// btcwallet configurations
	connCfg := &rpcclient.ConnConfig{
		Host:       "localhost:8332",
		Endpoint:   "ws",
		User:       "user",
		Pass:       "password",
		DisableTLS: true,
	}

	client, err := rpcclient.New(connCfg, &ntfnHandlers)
	defer client.Shutdown()

	if err != nil {
		log.Fatal(err)
	}

	c := api.Client{
		Rpc: client,
	}

	http.HandleFunc("/", c.GetTest)
	http.HandleFunc("/generateAddress", c.GenerateWalletAddress)

	PORT := "8000"
	fmt.Printf("%s> created http server on port %s\n", name, PORT)
	server := &http.Server{
		Addr:    ":" + PORT,
		Handler: nil,
	}

	fmt.Printf("%s> server listening on :%s\n", name, PORT)
	go func() {
		err = server.ListenAndServe()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	// Waits for signal to terminate program
	<-ctx.Done()

	// Waits for all other processes to terminate before shutting down main process
	<-btcdDone
	<-walletDone
	fmt.Printf("%s> Processes terminated, shutting down HTTP server...\n", name)
	if err := server.Shutdown(context.Background()); err != nil {
		log.Fatalf("HTTP server shutdown error: %v", err)
	}
	fmt.Printf("%s> Shut down HTTP server\n", name)

	fmt.Printf("%s> All processes terminated. Exiting program.\n", name)
}
