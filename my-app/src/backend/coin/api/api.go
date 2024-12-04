package api

import (
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/rpcclient"
	"github.com/eh-van5/cse416-amoeba/server"
)

type Client struct {
	ProcessManager *server.ProcessManager
	Rpc            *rpcclient.Client
	Username       string
	Password       string
}

// Test http connection
// https://localhost:PORT/
func GetTest(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got / request\n")
	io.WriteString(w, "This is my message!\n")
}

func (c *Client) UnlockWallet() {
	c.Rpc.WalletPassphrase(c.Password, 0)
}

func (c *Client) LockWallet() {
	c.Rpc.WalletLock()
}

func (c *Client) StopServer(w http.ResponseWriter, r *http.Request) {
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

	c.UnlockWallet()

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
	io.WriteString(w, info.String())

	// time.AfterFunc(time.Second*5, func() {
	// 	log.Println("Locking Wallet...")
	// 	client.WalletLock()
	// 	log.Println("Wallet lock complete.")
	// })

	c.LockWallet()
}

func (c *Client) GetBlockCount(w http.ResponseWriter, r *http.Request) (int64, error) {
	blockCount, err := c.Rpc.GetBlockCount()
	if err != nil {
		return 0, err
	}

	return blockCount, nil
}

// starts mining 1 block
func (c *Client) MineOneBlock(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("Mining starting")
	c.UnlockWallet()

	address, err := btcutil.DecodeAddress(c.Username, &chaincfg.MainNetParams)
	if err != nil {
		fmt.Printf("Error decoding Mining address (StartMining): %v\n", err)
		c.LockWallet()
		io.WriteString(w, "Mining stopped")
		return

	}
	/*
		_, err = c.Rpc.GenerateToAddress(1,address,nil)

		if err != nil {
			fmt.Printf("Error Generating to Address (StartMining): %v\n", err)
			c.LockWallet()
			return
		}
		io.WriteString(w,"Mining started")*/

	for {
		// mine one block
		blockHashes, err := c.Rpc.GenerateToAddress(1, address, nil)

		if err != nil {
			fmt.Printf("Error generating to address (StartMining): %v\n", err)
			io.WriteString(w, "Error mining block. Retrying...\n")
			continue
		}

		// Check if the block was successfully mined by checking the response
		if len(blockHashes) > 0 {
			// Block successfully mined
			fmt.Printf("Successfully mined block: %s\n", blockHashes[0])
		} else {
			// no block mined
			fmt.Printf("Mining attempt failed (no block hashes returned)\n")
			io.WriteString(w, "Mining attempt failed. Retrying...\n")
		}

	}
}

func (c *Client) StopMining(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Stopping mining...")
	c.LockWallet()
	io.WriteString(w, "Mining stopped")
}
