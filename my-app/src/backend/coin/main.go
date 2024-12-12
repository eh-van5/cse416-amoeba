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
	"path/filepath"
	"encoding/json"

	"github.com/btcsuite/btcd/rpcclient"
	"github.com/eh-van5/cse416-amoeba/api"
	"github.com/eh-van5/cse416-amoeba/server"
	"github.com/rs/cors"
)

type Config struct {
	WalletAddress string `json:"wallet_address"`
	NodeSeed       string `json:"node_seed"`
}

func SaveConfig(filePath string, config *Config) error {
	file, err := os.Create(filePath)
	if err != nil {
	return fmt.Errorf("failed to create config file: %v", err)
	}
	defer file.Close()
	
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ") // Format the JSON with indentation
	if err := encoder.Encode(config); err != nil {
	return fmt.Errorf("failed to encode config file: %v", err)
	}
	
	return nil
}
func main() {
	name := "Colony"
	PORT := 8000


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
		AllowedMethods:   []string{"GET", "POST"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	// Handle functions
	mux.HandleFunc("/", api.GetTest)
	mux.HandleFunc("/createWallet/{username}/{password}", api.CreateWallet)
	mux.HandleFunc("/getWalletPath", api.GetWalletPath)
	mux.HandleFunc("/importWallet", func(w http.ResponseWriter, r *http.Request){
		fmt.Printf("got /importWallet request\n")

		username := r.FormValue("username")
		password := r.FormValue("password")
		// Parse form to ensure correct formData
		if err := r.ParseForm(); err != nil {
			http.Error(w, "Unable to parse form. Please try another file", http.StatusBadRequest)
			fmt.Printf("ParseForm() err: %v", err)
			return
		}

		// Retrieves file from form data
		file, _, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "Unable to retrieve file. Please try another file", http.StatusBadRequest)
			fmt.Println("Error retrieving file:", err)
			return
		}
		defer file.Close()
		fmt.Printf("File retrieved\n")

		walletPath, err := api.GetWalletPathInternal()
		if err != nil {
			http.Error(w, "Unable to get wallet path", http.StatusBadRequest)
			fmt.Println("Error getting path:", err)
			return
		}
		destPath := filepath.Join(walletPath, "wallet.db")

		// Deletes any existing wallet.db file in ~/.btcwallet directory
		if _, err := os.Stat(destPath); err == nil {
			fmt.Printf("Existing wallet exists, deleting...\n")
			err := os.Remove(destPath)
			if err != nil {
				http.Error(w, "Error deleting existing wallet. Please try again", http.StatusInternalServerError)
				fmt.Println("Error deleting existing wallet:", err)
				return
			}
		}
		fmt.Printf("Existing wallet deleted\n")

		// Creates wallet.db file in ~/.btcwallet directory
		destFile, err := os.Create(destPath)
		if err != nil {
			http.Error(w, "Error creating file. Please try another file", http.StatusInternalServerError)
			fmt.Println("Error creating file:", err)
			return
		}
		defer destFile.Close()
		fmt.Printf("Wallet file created\n")

		// Copies imported wallet.db onto the new file
		_, err = io.Copy(destFile, file)
		if err != nil {
			http.Error(w, "Unable to save file. Please try another file", http.StatusInternalServerError)
			fmt.Println("Error saving file:", err)
			return
		}
		fmt.Printf("Wallet file copied\n")

		// Attempts Login with new wallet
		url := fmt.Sprintf("http://localhost:%d/login/%s/%s", PORT, username, password)
		fmt.Println(url)
		_, err = http.Get(url)
		if err != nil{
			fmt.Printf("Error logging in while importing: %v\n", err)
		}

		fmt.Printf("Colony> Successfully import wallet\n")
		io.WriteString(w, "Imported Wallet")
	})
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
	for len(stopServerChan) > 0 {
		<-stopServerChan
	}

	username := r.PathValue("username")
	password := r.PathValue("password")
	address := r.PathValue("miningaddr")

	config := &Config{
		WalletAddress: address,
		NodeSeed: address,
	}
	// Save the configuration to a file
	configPath := "../config.json"
	if err := SaveConfig(configPath, config); err != nil {
		fmt.Printf("Error saving config: %v\n", err)
	} else {
		fmt.Println("Config saved successfully.")
	}

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
		time.Sleep(1 * time.Second)
		err = state.UnlockWallet()
		if err != nil {
			fmt.Printf("Colony> Unable to unlock wallet, Incorrect password: %v\n", err)
			if strings.Contains(err.Error(), "Chain RPC is inactive"){
				http.Error(w, "Chain RPC is inactive. Please try again.", http.StatusInternalServerError)
			} else {
				http.Error(w, "Incorrect Credentials. Please try again.", http.StatusInternalServerError)
			}
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
