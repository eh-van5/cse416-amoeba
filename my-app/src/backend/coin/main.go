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

	"github.com/btcsuite/btcd/rpcclient"
	"github.com/eh-van5/cse416-amoeba/api"
	"github.com/eh-van5/cse416-amoeba/server"
	"github.com/rs/cors"
)

func main() {
	name := "Colony"

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, os.Interrupt, syscall.SIGTERM)
	done := make(chan bool, 1)
	stopServerChan := make(chan bool, 1)

	state := &api.Client{}

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

	// Handle functions
	mux.HandleFunc("/", api.GetTest)
	mux.HandleFunc("/createWallet/{username}/{password}", api.CreateWallet)
	mux.HandleFunc("/login/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
		Login(w, r, mux, state, stopServerChan)
	})
	mux.HandleFunc("/login/{username}/{password}/{miningaddr}", func(w http.ResponseWriter, r *http.Request) {
		Login(w, r, mux, state, stopServerChan)
	})
	mux.HandleFunc("/stopServer", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("Colony> Stopping server. Logging out\n")
		stopServerChan <- true
		io.WriteString(w, "Stopped server. Logged out\n")
	})
	mux.HandleFunc("/generateAddress", func(w http.ResponseWriter, r *http.Request) {
		if state.Rpc == nil {
			http.Error(w, "Server not ready", http.StatusServiceUnavailable)
			return
		}
		state.GenerateWalletAddress(w, r)
	})
	mux.HandleFunc("/getData", func(w http.ResponseWriter, r *http.Request) {
		if state.Username == "" {
			http.Error(w, "No data available", http.StatusServiceUnavailable)
			return
		}
		state.GetAccountData(w, r)
	})

	mux.HandleFunc("/startMining/{username}/{password}/{numcpu}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("---- MineOneBlock 1\n")
		path := r.URL.Path
		path = strings.TrimPrefix(path, "/startMining/")
		parts := strings.Split(path, "/")
		numcpus := parts[2]
		numcpu, err := strconv.Atoi(numcpus)
		if err != nil {
			fmt.Println("Error converting string to int (Login/MineOneBlock):", err)
		}
		state.MineOneBlock(w, r, state.Address, numcpu)
	})
	mux.HandleFunc("/stopMining/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("stopMining 1\n")
		state.StopMining(w, r)
	})
	mux.HandleFunc("/getCPUThreads/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("Get CPU Threads\n")
		state.GetCPUThreads(w, r)
	})

	mux.HandleFunc("/getConnectionCount/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("Get Connection Count\n")
		state.GetConnectionCount(w, r)
	})
	mux.HandleFunc("/getWalletValue/{username}/{password}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("-GetWalletVal")
		walletAddr := state.Username
		state.GetWalletValue(w, r, walletAddr)
	})
	mux.HandleFunc("/sendToWallet/{username}/{password}/{walletAddr}/{amount}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("-send to Wallet")
		path := r.URL.Path
		path = strings.TrimPrefix(path, "/sendToWallet/")
		parts := strings.Split(path, "/")

		walletAddr := parts[2]
		amount := parts[3]
		state.SendToWallet(w, r, walletAddr, amount)
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

func Login(w http.ResponseWriter, r *http.Request, mux *http.ServeMux, state *api.Client, stopServerChan chan bool) {
	username := r.PathValue("username")
	password := r.PathValue("password")
	address := r.PathValue("miningaddr")

	started := make(chan bool, 1)

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)

	go func() {
		defer cancel()

		pm := &server.ProcessManager{
			Ctx: ctx,
		}

		// Starts btcd process
		go func() {
			err := pm.StartBtcd(address)
			if err != nil {
				fmt.Printf("Returned from btcd, error: %v\n", err)
				http.Error(w, "Incorrect credentials. Please try again.", http.StatusInternalServerError)
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
			err := pm.StartWallet(username)
			if err != nil {
				cancel()
				started <- false
				fmt.Printf("Returned from btcwallet, error: %v\n", err)
				http.Error(w, "Incorrect credentials. Please try again.", http.StatusInternalServerError)
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

		client, err := rpcclient.New(connCfg, nil)
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

		state.ProcessManager = pm
		state.Rpc = client
		state.Username = username
		state.Password = password
		state.Address = address

		// Unlock Wallet using password
		time.Sleep(500 * time.Millisecond)
		err = state.UnlockWallet()
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

		// Signals login complete
		started <- true

		fmt.Printf("Waiting for stopServer channel\n")
		<-stopServerChan
		fmt.Printf("Received from stopServer channel\n")
	}()

	// Waits for server to complete login before returning
	graceful := <-started
	if graceful {
		io.WriteString(w, "Logged into server!")
	}
}
