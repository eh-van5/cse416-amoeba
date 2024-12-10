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
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/btcsuite/btcd/btcutil"
	//"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/rpcclient"
	"github.com/btcsuite/btcd/wire"
	"github.com/eh-van5/cse416-amoeba/api"
	"github.com/eh-van5/cse416-amoeba/server"

	//"backend/coin/api"
	"github.com/rs/cors"
)

func main() {
	name := "Colony"

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, os.Interrupt, syscall.SIGTERM)
	done := make(chan bool, 1)

	// Checks if current session has logged in before
	loggedIn := false

	go func() {
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
		Login(w, r, mux, loggedIn)
		loggedIn = true
	})

	PORT := 8088
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

func Login(w http.ResponseWriter, r *http.Request, mux *http.ServeMux, loggedIn bool) {
	username := r.PathValue("username")
	password := r.PathValue("password")
	miningaddr := r.PathValue("miningaddr")
	if password == "" {
		return
	}

	started := make(chan bool, 1)

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)

	go func() {
		defer cancel()
		// defer close(started)

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

		pm := &server.ProcessManager{
			BtcdDone:   make(chan bool),
			WalletDone: make(chan bool),
		}

		// Starts btcd process
		go func() {
			err := pm.StartBtcd(ctx, "")
			if err != nil {
				fmt.Printf("Returned from btcd, error: %v\n", err)
				http.Error(w, "error starting btcd", http.StatusInternalServerError)
				started <- false
				cancel()
			}
		}()
		select {
		case <-ctx.Done():
			return
		case <-time.After(2 * time.Second): // Wait for btcd to start
		}

		// Starts btcwallet
		go func() {
			err := pm.StartWallet(ctx, username)
			if err != nil {
				fmt.Printf("Returned from btcwallet, error: %v\n", err)
				http.Error(w, "Incorrect credentials. Please try again.", http.StatusInternalServerError)
				started <- false
				cancel()
			}
		}()
		select {
		case <-ctx.Done():
			return
		case <-time.After(2 * time.Second): // Wait for btcwallet to start
		}

		// RPC configurations
		connCfg := &rpcclient.ConnConfig{
			Host:       "localhost:8332",
			Endpoint:   "ws",
			User:       "user",
			Pass:       "password",
			DisableTLS: true,
		}

		client, err := rpcclient.New(connCfg, &ntfnHandlers)
		if err != nil {
			fmt.Printf("Colony> Unable to connect to rpcclient: %v\n", err)
			http.Error(w, "Error logging in. Please try again", http.StatusInternalServerError)
			started <- false
			cancel()
		}
		select {
		case <-ctx.Done():
			return
		default:
		}

		// Only defer shutdown if client exists
		defer func() {
			if client != nil {
				client.Shutdown()
			}
		}()

		c := api.Client{
			ProcessManager: pm,
			Rpc:            client,
			Username:       username,
			Password:       password,
		}

		fmt.Printf("Username: %s\nPassword: %s\n", c.Username, c.Password)

		// Unlock Wallet using password
		err = c.UnlockWallet()
		if err != nil {
			fmt.Printf("Colony> Unable to unlock wallet, Incorrect password: %v\n", err)
			http.Error(w, "Incorrect Credentials. Please try again.", http.StatusInternalServerError)
			started <- false
			cancel()
		}
		select {
		case <-ctx.Done():
			return
		default:
		}

		// handle

		if !loggedIn {
			mux.HandleFunc("/generateAddress", c.GenerateWalletAddress)
			mux.HandleFunc("/stopServer", c.StopServer)
			mux.HandleFunc("/startMining/{username}/{password}/{miningaddr}/{numcpu}", func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("---- MineOneBlock 1\n")
				path := r.URL.Path
				path = strings.TrimPrefix(path, "/startMining/")
				parts := strings.Split(path, "/")
				numcpus := parts[3]
				numcpu, err := strconv.Atoi(numcpus)
				if err != nil {
					fmt.Println("Error converting string to int (Login/MineOneBlock):", err)
				}

				c.MineOneBlock(w, r, miningaddr, numcpu)
			})
			mux.HandleFunc("/stopMining/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("stopMining 1\n")
				c.StopMining(w, r)
			})
			mux.HandleFunc("/getCPUThreads/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Get CPU Threads\n")
				c.GetCPUThreads(w, r)
			})
			mux.HandleFunc("/getAllPeers/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Get All Peers\n")
				c.GetAllPeers(w, r)
			})
			mux.HandleFunc("/getWalletValue/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("-GetWalletVal 1")
				/*
					path := r.URL.Path
					path = strings.TrimPrefix(path, "/getWalletValue/")
					parts := strings.Split(path, "/")*/
				//walletAddr := parts[2]
				walletAddr := c.Username
				c.GetWalletValue(w, r, walletAddr)
			})
			mux.HandleFunc("/sendToWallet/{username}/{password}/{walletAddr}/{amount}", func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("-send to Wallet 1")
				path := r.URL.Path
				path = strings.TrimPrefix(path, "/sendToWallet/")
				parts := strings.Split(path, "/")

				walletAddr := parts[2]
				amount := parts[3]
				c.SendToWallet(w, r, walletAddr, amount)
			})

			fmt.Printf("Colony> HTTP handling functions\n")
		}

		// Signals login complete
		started <- true

		// Waits for signal to t nerminate program
		// <-ctx.Done()

		// Waits for all other processes to terminate before shutting down main process
		<-pm.BtcdDone
		<-pm.WalletDone
	}()

	// Waits for server to complete login before returning
	graceful := <-started
	if graceful {
		io.WriteString(w, "Logged into server!")
	}
}
