package main

import (
	"bufio"
	"fmt"
	"io"
	"os/exec"
	"time"

	"github.com/creack/pty"
)

func main() {
	StartBtcd()
	// StartWallet("pass2")
	// CreateWallet("pass1", "pass2")
	// fmt.Println("Hello")
}

// Starts the btcd process
func StartBtcd() {
	name := "btcd"
	// Gets path to executable file and arguments to pass into it
	executable := "../../coin/btcd/./btcd"
	args := []string{
		"--rpcuser=user",
		"--rpcpass=password",
		"--notls",
		"--debuglevel=info",
	}

	cmd := exec.Command(executable, args...)
	// cmd := exec.Command("echo", "hello")

	// Gets output stream of process
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Printf("Error reading %s stdout: %s", name, err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		fmt.Printf("Error reading %s stderr: %s", name, err)
	}

	// Starts running command
	if err := cmd.Start(); err != nil {
		fmt.Println("Error starting cmd: ", err)
	}

	// Print
	go OutputStream(stdout, name)
	go OutputStream(stderr, name)

	if err := cmd.Wait(); err != nil {
		fmt.Println("Error waiting for cmd: ", err)
	}
}

// Starts btcwallet to create a wallet
// Typically used when calling btcwallet for the first time
func CreateWallet(privatepass string, publicpass string) {
	name := "btcwallet"
	executable := "../../coin/btcwallet/./btcwallet"
	args := []string{
		"--btcdusername=user",
		"--btcdpassword=password",
		"--rpcconnect=127.0.0.1:8334",
		"--noclienttls",
		"--noservertls",
		"--username=user",
		"--password=password",
		"--create",
	}

	cmd := exec.Command(executable, args...)

	ptmx, err := pty.Start(cmd)
	if err != nil {
		fmt.Println("Error starting cmd with pty: ", err)
	}

	defer func() { _ = ptmx.Close() }()

	responses := []string{
		privatepass, // Enter the private passphrase for your new wallet
		privatepass, // Confirm passphrase
		"yes",       // Do you want to add an additional layer of encryption for public data? (n/no/y/yes) [no]
		publicpass,  // Enter the public passphrase for your new wallet
		publicpass,  // Confirm passphrase
		"no",        // Do you have an existing wallet seed you want to use? (n/no/y/yes) [no]
		"OK",        // Once you have stored the seed in a safe and secure location, enter "OK" to continue
	}
	fmt.Println("starting reads")

	// Interact with terminal
	go func() {
		scanner := bufio.NewScanner(ptmx)
		for scanner.Scan() {
			text := scanner.Text()
			fmt.Printf("%s> %s\n", name, text)
		}
	}()

	go func() {
		numResponses := 0
		// If last few characters in output is ':' then write input to cmd
		for _, response := range responses {
			fmt.Fprintln(ptmx, response)
			if err != nil {
				fmt.Println("Error writing to stdin:", err)
				return
			}
			numResponses++
			// Waits briefly before next line
			time.Sleep(100 * time.Millisecond)
		}
	}()

	if err := cmd.Wait(); err != nil {
		fmt.Println("Error waiting for cmd: ", err)
	}
}

// Starts the btcwallet process
// Assumes that wallet already exists
func StartWallet(walletpass string) {
	name := "btcwallet"

	// Gets path to command and arguments to pass into command
	executable := "../../coin/btcwallet/./btcwallet"
	args := []string{
		"--btcdusername=user",
		"--btcdpassword=password",
		"--rpcconnect=127.0.0.1:8334",
		"--noclienttls",
		"--noservertls",
		"--username=user",
		"--password=password",
		fmt.Sprintf("--walletpass=%s", walletpass),
	}
	cmd := exec.Command(executable, args...)
	fmt.Println("Starting btcwallet...")

	// Gets output stream of process
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Println("Error reading btcwallet stdout: ", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		fmt.Println("Error reading btcwallet stderr: ", err)
	}

	// Starts running command
	if err := cmd.Start(); err != nil {
		fmt.Println("Error starting cmd: ", err)
	}

	fmt.Println("Running btcwallet start")

	// Print
	go OutputStream(stdout, name)
	go OutputStream(stderr, name)

	if err := cmd.Wait(); err != nil {
		fmt.Println("Error waiting for cmd: ", err)
	}
}

// // Runs a btcctl command
// func runCommand() {

// 	cmd := exec.Command("../../scripts/btcd_wrapper.sh")

// 	output, err := cmd.StdoutPipe()

// 	if err != nil {
// 		fmt.Println("Error reading btcd stdout:", err)
// 	}

// 	fmt.Println("Reading stdout")
// 	scanner := bufio.NewScanner(output)
// 	for scanner.Scan() {
// 		fmt.Printf("[btcd] %s\n", scanner.Text())
// 	}
// }

func OutputStream(stream io.ReadCloser, name string) {
	scanner := bufio.NewScanner(stream)
	for scanner.Scan() {
		fmt.Printf("%s> %s\n", name, scanner.Text())
	}
}
