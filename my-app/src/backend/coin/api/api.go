package api

import (
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/rpcclient"
	"github.com/btcsuite/btcd/wire"
	"github.com/eh-van5/cse416-amoeba/server"
)

type Client struct {
	Rpc      *rpcclient.Client
	Password string
}

func (c *Client) GetTest(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got / request\n")
	io.WriteString(w, "This is my message!\n")
}

// FOR TESTING
func (c *Client) StartBtcd() {
	// Only override the handlers for notifications you care about.
	// Also note most of these handlers will only be called if you register
	// for notifications.  See the documentation of the rpcclient
	// NotificationHandlers type for more details about each handler.
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

	// Gets the rpc certificates from ~/home/user/.btcd/rpc.cert
	// btcdHomeDir := btcutil.AppDataDir("btcd", false)
	// certs, err := os.ReadFile(filepath.Join(btcdHomeDir, "rpc.cert"))

	// if err != nil {
	// 	log.Fatal(err)
	// }

	connCfg := &rpcclient.ConnConfig{
		Host:       "localhost:8334",
		Endpoint:   "ws",
		User:       "user",
		Pass:       "password",
		DisableTLS: true,
		// Certificates: certs,
	}

	// Connect to rpc server
	client, err := rpcclient.New(connCfg, &ntfnHandlers)
	if err != nil {
		log.Fatal(err)
	}

	// Get the current block count.
	blockCount, err := client.GetBlockCount()
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Block count: %d", blockCount)

	// log.Println("Client shutting down...")
	// client.Shutdown()
	// log.Println("Client shutdown complete.")

	// Wait until client shuts down gracefully or with Ctrl+C
	client.WaitForShutdown()
}

func (c *Client) UnlockWallet() {
	c.Rpc.WalletPassphrase(c.Password, 0)
}

func (c *Client) LockWallet() {
	c.Rpc.WalletLock()
}

// Creates a new wallet
func (c *Client) CreateWallet() {
	privateKey, err := server.CreateWallet("pass1", "pass2")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(privateKey)
}

// Gets new wallet address for mining
func (c *Client) GenerateWalletAddress(w http.ResponseWriter, r *http.Request) {
	// defer c.Rpc.Shutdown()

	c.UnlockWallet()

	// c.Rpc.CreateNewAccount("testaccount")

	info, err := c.Rpc.GetNewAddress("testaccount")
	if err != nil {
		log.Fatal(err)
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
