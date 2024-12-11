package api

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"encoding/json"

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

func (c *Client) StopServer(w http.ResponseWriter, r *http.Request) {
	// CURRENT PROBLEM: When signalling or calling this function, the process in ps -e is not killed
	fmt.Printf("got /stopServer request\n")

	c.ProcessManager.StopServer()

	io.WriteString(w, "Stopped server attemped")
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

// func (c *Client) CreateAccount(w http.ResponseWriter, r *http.Request) {
// 	fmt.Printf("got /createAccount request\n")

// 	c.LockWallet()
// }

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

	// time.AfterFunc(time.Second*5, func() {
	// 	log.Println("Locking Wallet...")
	// 	client.WalletLock()
	// 	log.Println("Wallet lock complete.")
	// })

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
