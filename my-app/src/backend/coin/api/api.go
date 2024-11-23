package api

import (
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/btcsuite/btcd/rpcclient"
	"github.com/eh-van5/cse416-amoeba/server"
)

type Client struct {
	ProcessManager *server.ProcessManager
	Rpc            *rpcclient.Client
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

	pass1 := r.PathValue("pass1")
	pass2 := r.PathValue("pass2")

	privateKey, err := server.CreateWallet(pass1, pass2)
	if err != nil {
		log.Fatal(err)
	}

	io.WriteString(w, privateKey)
}

// Gets new wallet address for mining
func (c *Client) GenerateWalletAddress(w http.ResponseWriter, r *http.Request) {
	// defer c.Rpc.Shutdown()
	fmt.Printf("got /generateAddress request\n")

	c.UnlockWallet()

	// c.Rpc.CreateNewAccount("testaccount")

	info, err := c.Rpc.GetNewAddress("testaccount")
	if err != nil {
		fmt.Printf("Error getting new mining address: %v", err)
	}

	// fmt.Println(info)
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
