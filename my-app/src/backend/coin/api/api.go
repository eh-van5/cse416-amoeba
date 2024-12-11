package api

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"encoding/json"
	"os/user"
	"runtime"
	"path/filepath"

	"github.com/btcsuite/btcd/rpcclient"
	"github.com/eh-van5/cse416-amoeba/server"
)

type Client struct {
	ProcessManager *server.ProcessManager
	Rpc            *rpcclient.Client
	Username       string
	Password       string
	Address 	   string
}

// Test http connection
// https://localhost:PORT/
func GetTest(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got / request\n")
	io.WriteString(w, "This is my message!\n")
}

func (c *Client) UnlockWallet() (error){
	err := c.Rpc.WalletPassphrase(c.Password, 0)

	if err != nil{
		fmt.Printf("Error unlocking wallet!\n")
		return err
	}
	fmt.Printf("Unlocked wallet!\n")
	return nil
}

func (c *Client) LockWallet() {
	c.Rpc.WalletLock()
}

func GetWalletPath(w http.ResponseWriter, r *http.Request){
	fmt.Printf("got /getWalletPath request\n")

	// Get user directory
	user, err := user.Current()
	if err != nil {
		http.Error(w, "Error getting user directory", http.StatusInternalServerError)
	}

	path := ""
	switch runtime.GOOS {
	case "linux":
		path = filepath.Join(user.HomeDir, ".btcwallet", "mainnet")
	case "windows": 
		path = filepath.Join(user.HomeDir, "AppData", "Roaming", "Btcwallet", "mainnet")
	case "darwin": // macOS
		path = filepath.Join(user.HomeDir, "Library", "Application Support", "Btcwallet", "mainnet")
	default:
		http.Error(w, "OS is not supported", http.StatusInternalServerError)
	}

	io.WriteString(w, path)
}

// Creates a new wallet
func CreateWallet(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got /createWallet request\n")

	username := r.PathValue("username")
	password := r.PathValue("password")

	privateKey, err := server.CreateWallet(username, password)
	if err != nil {
		log.Fatal(err)
	}

	io.WriteString(w, privateKey)
}

// Gets new wallet address for mining
func (c *Client) GenerateWalletAddress(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got /generateAddress request\n")

	// Username name will be used as account name
	err := c.Rpc.CreateNewAccount(c.Username)
	if err != nil {
		fmt.Printf("Error creating new wallet account: %v\n", err)
	}

	info, err := c.Rpc.GetNewAddress(c.Username)
	if err != nil {
		fmt.Printf("Error getting new mining address: %v\n", err)
	}

	fmt.Println(info)
	// Saves address to client
	c.Address = info.String()
	io.WriteString(w, info.String())

	c.LockWallet()
}

func (c *Client) GetAccountData(w http.ResponseWriter, r *http.Request){
	// Create a map or struct for the response data
	data := map[string]string{
		"username": c.Username,
		"password": c.Password,
		"address":  c.Address,
	}

	// Set the response content type to JSON
	w.Header().Set("Content-Type", "application/json")

	// Encode the data into JSON and write it to the response
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (c *Client) GetBlockCount(w http.ResponseWriter, r *http.Request) (int64, error) {
	blockCount, err := c.Rpc.GetBlockCount()
	if err != nil {
		return 0, err
	}

	return blockCount, nil
}
