package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/rpcclient"
	"github.com/btcsuite/btcd/wire"
	"github.com/eh-van5/cse416-amoeba/api"
	"github.com/eh-van5/cse416-amoeba/server"
)

// import (
// 	"log"

// 	"github.com/gofiber/fiber/v2"
// )

// func main() {
// 	app := fiber.New()

// 	app.Get("/", GetTest)

// 	log.Fatal(app.Listen(":4000"))
// }

// func GetTest(c *fiber.Ctx) error {
// 	return c.Status(200).JSON(fiber.Map{"msg": "Hello World"})
// }

func main() {
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

	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, os.Interrupt, syscall.SIGTERM)

	server.StartBtcd("", sigchan)
	time.Sleep(3 * time.Second)
	server.StartWallet("pass2", sigchan)
	time.Sleep(3 * time.Second)

	// // btcd configurations
	// connCfg := &rpcclient.ConnConfig{
	// 	Host:       "localhost:8334",
	// 	Endpoint:   "ws",
	// 	User:       "user",
	// 	Pass:       "password",
	// 	DisableTLS: true,
	// }

	// btcwallet configurations
	connCfg := &rpcclient.ConnConfig{
		Host:       "localhost:8332",
		Endpoint:   "ws",
		User:       "user",
		Pass:       "password",
		DisableTLS: true,
	}

	client, err := rpcclient.New(connCfg, &ntfnHandlers)
	if err != nil {
		log.Fatal(err)
	}

	c := api.Client{
		Rpc: client,
	}

	http.HandleFunc("/", c.GetTest)
	http.HandleFunc("/generateAddress", c.GenerateWalletAddress)

	// api.CreateWallet()
	// api.StartWallet()
	// server.StartBtcd()
	// server.StartWallet("pass2")

	PORT := "8000"

	fmt.Printf("Colony> server listening on :%s\n", PORT)
	err = http.ListenAndServe(":"+PORT, nil)

	if err != nil {
		log.Fatal(err)
	}

	go func() {
		<-sigchan
		fmt.Printf("Received signal. Terminating Colony.\n")
		c.Rpc.Shutdown()
		fmt.Printf("Terminated.")
	}()
}
