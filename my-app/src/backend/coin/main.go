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
<<<<<<< HEAD
	//"backend/coin/api"
=======
	"github.com/rs/cors"
>>>>>>> 9757a29723bfbb5419235fc40dcfe2fa64bef974
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

	// Create new server mux and set cors options to allow requests from react server at port 3000
	mux := http.NewServeMux()
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	// Functions in the login page
	mux.HandleFunc("/", api.GetTest)
	mux.HandleFunc("/createWallet/{username}/{password}", api.CreateWallet)
	mux.HandleFunc("/login/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
		Login(w, r, mux)
	})

	PORT := 8000
	fmt.Printf("%s> created http server on port %d\n", name, PORT)
	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", PORT),
		Handler: handler,
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

func Login(w http.ResponseWriter, r *http.Request, mux *http.ServeMux) {
	username := r.PathValue("username")
	password := r.PathValue("password")
	if password == "" {
		return
	}

	io.WriteString(w, "Logged into server!")

	started := make(chan bool, 1)

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
<<<<<<< HEAD
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
=======
		mux.HandleFunc("/generateAddress", c.GenerateWalletAddress)
		mux.HandleFunc("/stopServer", c.StopServer)

		fmt.Printf("HTTP handling functions\n")

		// Signals login complete
		started <- true
>>>>>>> 9757a29723bfbb5419235fc40dcfe2fa64bef974

		// Waits for signal to terminate program
		// <-ctx.Done()

		// Waits for all other processes to terminate before shutting down main process
		<-pm.BtcdDone
		<-pm.WalletDone
	}()

	// Waits for server to complete login before returning
	<-started
}
