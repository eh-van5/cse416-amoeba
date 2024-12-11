package api

import (
	//"encoding/json"
	"encoding/json"
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
	Address        string
}

// Test http connection
// https://localhost:PORT/
func GetTest(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got / request\n")
	io.WriteString(w, "This is my message!\n")
}

func (c *Client) UnlockWallet() error {
	err := c.Rpc.WalletPassphrase(c.Password, 0)

	if err != nil {
		fmt.Printf("Error unlocking wallet!\n")
		return err
	}
	fmt.Printf("Unlocked wallet!\n")
	return nil
}

func (c *Client) LockWallet() {
	c.Rpc.WalletLock()
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

func (c *Client) GetAccountData(w http.ResponseWriter, r *http.Request) {
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

var stopMining bool

// starts mining blocks , possibly forever until stop
// GIVEN mining address and the number of cpus (this does not use numcpus)
// this is an unused function, use MineOneBlock instead
func (c *Client) MineOneBlockOld(w http.ResponseWriter, r *http.Request, miningaddr string, numcpu int) {
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

// modified version of Mine, this allows you to specify the cpu rate
func (c *Client) MineOneBlock(w http.ResponseWriter, r *http.Request, miningaddr string, numcpu int) {
	fmt.Printf("Mining starting")
	c.UnlockWallet()
	stopMining = false
	address, err := btcutil.DecodeAddress(miningaddr, &chaincfg.MainNetParams)
	if err != nil {
		fmt.Printf("Error Decoding Address (StartMining): %v\n", err)
		c.LockWallet()
		io.WriteString(w, "Mining stopped\n")
		return
	}
	err = c.Rpc.SetGenerate(false, 0)
	if err != nil {
		fmt.Printf("Error Mining (StartMining): %v\n", err)
		c.LockWallet()
		io.WriteString(w, "Mining stopped\n")
		return
	}

	fmt.Printf("Stopping previous instances of Mining...")
	time.Sleep(time.Second * 1)
	fmt.Printf("Starting Mining with selected cpu cores...")
	err = c.Rpc.SetGenerate(true, numcpu)
	time.Sleep(time.Second * 1)

	fmt.Printf("Decoded Address: %s", address)
	if err != nil {
		fmt.Printf("Error decoding Mining address (StartMining): %v\n", err)
		c.LockWallet()
		io.WriteString(w, "Mining stopped\n")
		return
	}

	if stopMining {
		fmt.Println("Mining stopped (in loop)")
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
func (c *Client) GetConnectionCount(w http.ResponseWriter, r *http.Request) int64 {
	fmt.Println("Getting connection count")
	count, err := c.Rpc.GetConnectionCount()
	if err != nil {
		fmt.Printf("Error Getting Connection Count: %v\n", err)
		return -1
	}
	fmt.Printf("Connection Count: %d\n", count)
	io.WriteString(w, fmt.Sprintf("%d\n", count))
	return count
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
	if stopMining {
		c.LockWallet()
	}
	infoNum := float64(info) / 100000000.0
	fmt.Printf("Value of Wallet %s is : %s\n", walletAddr, info)
	//io.WriteString(w, "Wallet Value Fetched\n")
	io.WriteString(w, fmt.Sprintf("%.8f\n", infoNum))
	return info
}

// sends to this walletAddr (????)
func (c *Client) SendToWallet(w http.ResponseWriter, r *http.Request, walletAddr string, amt string) {
	fmt.Printf("Sending %s coin to wallet %s", amt, walletAddr)

	if !stopMining {
		fmt.Printf("Cannot send while mining\n")
		io.WriteString(w, fmt.Sprintf("%d\n", -1))

	}
	amtFloat, err := strconv.ParseFloat(amt, 64)
	if err != nil {
		fmt.Printf("Error converting amount value to Float (sendToWallet): %v\n", err)
		io.WriteString(w, fmt.Sprintf("%d\n", -1))
		return

	}
	amt_btc, err := btcutil.NewAmount(amtFloat)
	if err != nil {
		fmt.Printf("Error converting btc amount to btcutil.NewAmount (sendToWallet): %v\n", err)
		io.WriteString(w, fmt.Sprintf("%d\n", -1))
		return

	}
	fmt.Printf("Send amount (sendToWallet): %v\n", amt_btc)
	c.UnlockWallet()
	info, err := c.Rpc.GetBalance(c.Username)

	if err != nil {
		fmt.Printf("Error Getting Wallet Info: %v\n", err)
		//io.WriteString(w, "Error Getting Wallet Info\n")
		io.WriteString(w, fmt.Sprintf("%d\n", -1))
		return
	}
	if info < amt_btc {
		fmt.Printf("Insufficient funds\n")
		//io.WriteString(w, "Insufficient funds\n")
		io.WriteString(w, fmt.Sprintf("%d\n", -1))
		return
	}

	walletAddr_btc, err := btcutil.DecodeAddress(walletAddr, &chaincfg.MainNetParams)
	if err != nil {
		fmt.Printf("Error decoding recipient address (sendToWallet): %v\n", err)
		//io.WriteString(w, "Error decoding recipient address\n")
		io.WriteString(w, fmt.Sprintf("%d\n", -1))
		return
	}
	hash, err := c.Rpc.SendFrom(c.Username, walletAddr_btc, amt_btc)
	if err != nil {
		fmt.Printf("Error sending to wallet (sendToWallet): %v\n", err)
		//io.WriteString(w, "Error sending to wallet\n")
		io.WriteString(w, fmt.Sprintf("%d\n", -1))
		c.LockWallet()
		return
	}
	/* this does not work
	if stopMining {
		c.LockWallet()
	}*/

	c.LockWallet()
	fmt.Printf("Sent coin: %s\n", hash)
	io.WriteString(w, fmt.Sprintf("%d\n", 0))
}

func (c *Client) GetCPUThreads(w http.ResponseWriter, r *http.Request) int {
	numCpu := runtime.NumCPU()
	fmt.Printf("Number of Threads: %d\n", numCpu)
	io.WriteString(w, fmt.Sprintf("%d\n", numCpu))
	return numCpu
}
