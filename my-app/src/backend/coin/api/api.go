package api

import (
	//"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"runtime"
	"strconv"
	"time"

	"github.com/btcsuite/btcd/btcjson"
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

var stopMining bool

// starts mining blocks , possibly forever until stop
// GIVEN mining address and the number of cpus (this does not use numcpus)
func (c *Client) MineOneBlocka(w http.ResponseWriter, r *http.Request, miningaddr string, numcpu int) {
	fmt.Printf("Mining starting")
	c.UnlockWallet()
	stopMining = false
	address, err := btcutil.DecodeAddress(miningaddr, &chaincfg.MainNetParams)

	fmt.Printf("Decoded Address: %s", address)
	if err != nil {
		fmt.Printf("Error decoding Mining address (StartMining): %v\n", err)
		c.LockWallet()
		io.WriteString(w, "Mining stopped\n")
		return
	}
	//var tryAmt int64 = 10
	for {
		//blockHashes, err := c.Rpc.GenerateToAddress(1, address, &tryAmt) //this does not work (idk why)
		//breaks out of the infinite loop
		if stopMining {
			fmt.Println("Mining stopped")
			c.LockWallet()
			io.WriteString(w, "Mining stopped\n")
			break
		}
		blockHashes, err := c.Rpc.Generate(1)
		if err != nil {
			fmt.Printf("Error generating to address (StartMining): %v\n", err)
			io.WriteString(w, "Error mining block. Retrying...\n")
			//continue
		}

		if len(blockHashes) > 0 {
			fmt.Printf("Successfully mined block: %s\n", blockHashes[0])
		} else {
			fmt.Printf("Mining attempt failed (no block hashes returned)\n")
			io.WriteString(w, "Mining attempt failed. Retrying...\n")
		}
		fmt.Printf("--Back to Mining another block--\n")
	}

}

// modified version of Mine
func (c *Client) MineOneBlock(w http.ResponseWriter, r *http.Request, miningaddr string, numcpu int) {
	fmt.Printf("Mining starting")
	c.UnlockWallet()
	stopMining = false
	address, err := btcutil.DecodeAddress(miningaddr, &chaincfg.MainNetParams)
	c.Rpc.SetGenerate(false, 0)
	fmt.Printf("Stopping previous instances of Mining...")
	time.Sleep(time.Second * 10)
	fmt.Printf("Starting Mining with selected cpu cores...")
	c.Rpc.SetGenerate(true, numcpu)
	time.Sleep(time.Second * 10)

	fmt.Printf("Decoded Address: %s", address)
	if err != nil {
		fmt.Printf("Error decoding Mining address (StartMining): %v\n", err)
		c.LockWallet()
		io.WriteString(w, "Mining stopped\n")
		return
	}
	//var tryAmt int64 = 10

	//blockHashes, err := c.Rpc.GenerateToAddress(1, address, &tryAmt) //this does not work (idk why)
	//breaks out of the infinite loop
	if stopMining {
		fmt.Println("Mining stopped")
		c.LockWallet()
		io.WriteString(w, "Mining stopped\n")
		return
	}

}

// Stops mining by locking the wallet
func (c *Client) StopMining(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Stopping mining...")
	stopMining = true
	c.Rpc.SetGenerate(false, 0)
	c.LockWallet()
	io.WriteString(w, "Mining stopped")
}

// function to return all the peers that are connected(?)
func (c *Client) GetAllPeers(w http.ResponseWriter, r *http.Request) []btcjson.GetPeerInfoResult {
	fmt.Println("Getting all peers...")
	peers, err := c.Rpc.GetPeerInfo()
	if err != nil {
		fmt.Printf("Error Getting All Peers (GetAllPeers): %v\n", err)
		return nil
	}
	for _, peer := range peers {
		fmt.Printf("Peer ID: %v, Address: %v, Connection time: %v, BytesSent: %v, PingTime %v\n",
			peer.ID, peer.Addr, peer.ConnTime, peer.BytesSent, peer.PingTime)
	}
	io.WriteString(w, "Peers fetched")
	return peers
}

// function to connect to a particular peer but idk why you need that
func (c *Client) ConnectToPeer(w http.ResponseWriter, r *http.Request, peer *btcjson.GetPeerInfoResult) {
	peerAddr := peer.Addr
	fmt.Printf("Connecting to peer with address: %s\n", peerAddr)
	err := c.Rpc.AddNode(peerAddr, "add")
	if err != nil {
		fmt.Printf("Error connecting to peer: %v\n", err)
		io.WriteString(w, "Error connecting to peer\n")
		return
	}
	fmt.Printf("Connected to peer: %s\n", peerAddr)
	io.WriteString(w, "Connected to Peer\n")
}

// function to query the value of a wallet
func (c *Client) GetWalletValue(w http.ResponseWriter, r *http.Request, walletAddr string) btcutil.Amount {
	fmt.Printf("Getting value of wallet... %s\n", walletAddr)
	c.UnlockWallet()
	info, err := c.Rpc.GetBalance(walletAddr)

	if err != nil {
		fmt.Printf("Error Getting Wallet Info: %v\n", err)
		io.WriteString(w, "Error Getting Wallet Info\n")
		return -1
	}
	if stopMining == true {
		c.LockWallet()
	}
	fmt.Printf("Value of Wallet %s is : %s\n", walletAddr, info)
	io.WriteString(w, "Wallet Value Fetched\n")
	return info
}

// sends to this walletAddr (????)
func (c *Client) SendToWallet(w http.ResponseWriter, r *http.Request, walletAddr string, amt string) {
	fmt.Printf("Sending %s coin to wallet %s", amt, walletAddr)

	walletAddr_btc, err := btcutil.DecodeAddress(walletAddr, &chaincfg.MainNetParams)
	if err != nil {
		fmt.Printf("Error decoding Mining address (sendToWallet): %v\n", err)
		return
	}
	amtFloat, err := strconv.ParseFloat(amt, 64)
	if err != nil {
		fmt.Printf("Error converting amount value to Float (sendToWallet): %v\n", err)
		return

	}
	amt_btc, err := btcutil.NewAmount(amtFloat)
	if err != nil {
		fmt.Printf("Error converting btc amount to btcutil.NewAmount (sendToWallet): %v\n", err)
		return

	}
	c.UnlockWallet()
	hash, err := c.Rpc.SendToAddress(walletAddr_btc, amt_btc)
	if err != nil {
		fmt.Printf("Error Sending amount to wallet: %v\n", err)
		io.WriteString(w, "Error Getting Wallet Info\n")
		return
	}
	if stopMining == true {
		c.LockWallet()
	}
	//c.LockWallet()
	fmt.Printf("Hash of sent coin: %s\n", hash)
	io.WriteString(w, "Sent to Wallet\n")
}

func (c *Client) GetCPUThreads(w http.ResponseWriter, r *http.Request) int {
	return runtime.NumCPU()
}
