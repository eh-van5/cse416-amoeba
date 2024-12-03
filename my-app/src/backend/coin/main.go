package main

import (
	"context"
	"errors"
	"fmt"
	"io"
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
	//"backend/coin/api"
)

func main() {
	name := "Colony"

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, os.Interrupt, syscall.SIGTERM)
	done := make(chan bool, 1)

	go func() {
		// <-sigs
		<-sigs
		fmt.Printf("signal received. Done\n")
		done <- true
	}()

	// Functions in the login page
	http.HandleFunc("/", api.GetTest)
	http.HandleFunc("/createWallet/{username}/{password}", api.CreateWallet)
	http.HandleFunc("/login/{username}/{password}", Login)

	PORT := 8000
	fmt.Printf("%s> created http server on port %d\n", name, PORT)
	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", PORT),
		Handler: nil,
	}

	fmt.Printf("%s> server listening on :%d\n", name, PORT)
	go func() {
		err := httpServer.ListenAndServe()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	<-done

	fmt.Printf("%s> Processes terminated, shutting down HTTP server...\n", name)
	if err := httpServer.Shutdown(context.Background()); err != nil {
		log.Fatalf("HTTP server shutdown error: %v", err)
	}
	fmt.Printf("%s> Shut down HTTP server\n", name)

	fmt.Printf("%s> All processes terminated. Exiting program.\n", name)
}

func Login(w http.ResponseWriter, r *http.Request) {
	username := r.PathValue("username")
	password := r.PathValue("password")
	if password == "" {
		return
	}

	io.WriteString(w, "Logged into server!")

	go func() {

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
		defer cancel()

		pm := &server.ProcessManager{
			BtcdDone:   make(chan bool),
			WalletDone: make(chan bool),
		}

		// Starts btcd process
		pm.StartBtcd(ctx, "")
		// Wait for btcd to start
		time.Sleep(3 * time.Second)

		// Starts btcwallet
		pm.StartWallet(ctx, username)
		// Wait for btcwallet to start
		time.Sleep(3 * time.Second)

		// RPC configurations
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
			ProcessManager: pm,
			Rpc:            client,
			Username:       username,
			Password:       password,
		}

		fmt.Printf("Username: %s\nPassword:%s\n", c.Username, c.Password)

		// handle
		http.HandleFunc("/generateAddress", c.GenerateWalletAddress)
		http.HandleFunc("/stopServer", c.StopServer)
		//http.HandleFunc("/mineOneBlock/{username}/{password}", api.MineOneBlock)
		//http.HandleFunc("/stopMining/{username}/{password}", api.StopMining)
		http.HandleFunc("/mineOneBlock/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
			c.MineOneBlock(w, r)
		})
		http.HandleFunc("/stopMining/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
			c.StopMining(w, r)
		})

		// Waits for signal to terminate program
		// <-ctx.Done()

		// Waits for all other processes to terminate before shutting down main process
		<-pm.BtcdDone
		<-pm.WalletDone
	}()
}
