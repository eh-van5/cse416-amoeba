package server

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/creack/pty"
)

type ProcessManager struct {
	btcdCmd   *exec.Cmd
	walletCmd *exec.Cmd
	Ctx       context.Context
}

// Starts the btcd process
// miningAddress is used for mining, obtained by calling GetNewAdrress
func (pm *ProcessManager) StartBtcd(miningAddress string) error {
	name := "btcd"
	fmt.Printf("Starting %s...\n", name)

	// Gets path to executable file and arguments to pass into it
	executable := "../../coin/btcd/./btcd"
	args := []string{
		"--rpcuser=user",
		"--rpcpass=password",
		"--notls",
		"--debuglevel=info",
		"--addpeer=130.245.173.221:8333", // Connects to TA network
	}

	// If a mining address is given
	if miningAddress != "" {
		args = append(args, "--miningaddr="+miningAddress)
	}

	pm.btcdCmd = exec.Command(executable, args...)

	// Gets output stream of process
	stdout, err := pm.btcdCmd.StdoutPipe()
	if err != nil {
		fmt.Printf("Error getting %s stdout: %s\n", name, err)
	}
	stderr, err := pm.btcdCmd.StderrPipe()
	if err != nil {
		fmt.Printf("Error reading %s stderr: %s\n", name, err)
	}

	// Starts running command
	if err := pm.btcdCmd.Start(); err != nil {
		fmt.Println("Error starting cmd: ", err)
	}

	go OutputStream(stdout, name)
	go OutputStream(stderr, name)

	// Waits for stop signals to terminate process
	go func() {
		<-pm.Ctx.Done()
		fmt.Printf("%s> Stopping %s...\n", name, name)
		pm.btcdCmd.Process.Signal(os.Interrupt)
		fmt.Printf("%s> Process killed\n", name)
	}()

	if err = pm.btcdCmd.Wait(); err != nil {
		return err
	}
	return nil
}

// Starts the btcwallet process
// Assumes that wallet already exists
func (pm *ProcessManager) StartWallet(walletpass string) error {
	name := "btcwallet"
	fmt.Printf("Starting %s...\n", name)

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
	pm.walletCmd = exec.Command(executable, args...)

	// Gets output stream of process
	stdout, err := pm.walletCmd.StdoutPipe()
	if err != nil {
		fmt.Printf("Error getting %s stdout: %s\n", name, err)
	}
	stderr, err := pm.walletCmd.StderrPipe()
	if err != nil {
		fmt.Printf("Error getting %s stderr: %s\n", name, err)
	}

	// Starts running command
	if err := pm.walletCmd.Start(); err != nil {
		fmt.Printf("Error starting %s: %s\n", name, err)
	}

	go OutputStream(stdout, name)
	go OutputStream(stderr, name)

	// Waits for stop signals to terminate process
	go func() {
		<-pm.Ctx.Done()
		fmt.Printf("%s> Stopping %s...\n", name, name)
		pm.walletCmd.Process.Signal(os.Interrupt)
		fmt.Printf("%s> Process killed\n", name)
	}()

	if err = pm.walletCmd.Wait(); err != nil {
		return err
	}

	return nil
}

// Starts btcwallet to create a wallet
// Typically used when calling btcwallet for the first time
func CreateWallet(username string, password string) (privateKey string, err error) {
	name := "btcwallet"
	// fmt.Printf("Starting %s...\n", name)

	// Gets path to executable file and arguments to pass into it
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

	// Starts command in pseudo-interactive terminal
	ptmx, err := pty.Start(cmd)
	if err != nil {
		fmt.Printf("Error starting %s with pty: %s\n", name, err)
		return "", err
	}

	defer func() { _ = ptmx.Close() }()

	// All responses to inputs
	responses := []string{
		password, // Enter the private passphrase for your new wallet
		password, // Confirm passphrase
		"yes",    // Do you want to add an additional layer of encryption for public data? (n/no/y/yes) [no]
		username, // Enter the public passphrase for your new wallet
		username, // Confirm passphrase
		"no",     // Do you have an existing wallet seed you want to use? (n/no/y/yes) [no]
		"OK",     // Once you have stored the seed in a safe and secure location, enter "OK" to continue
	}

	// Print stdout from pty
	go func() {
		scanner := bufio.NewScanner(ptmx)
		foundPrivateKey := false
		for scanner.Scan() {
			text := scanner.Text()

			// the next line will be the private key, store this and return at the end
			if foundPrivateKey {
				privateKey = text
				foundPrivateKey = false
			}
			fmt.Printf("%s> %s\n", name, text)

			if strings.Contains(text, "Your wallet generation seed is:") {
				foundPrivateKey = true
			}
		}
	}()

	go func() {
		numResponses := 0
		// Writes all responses to interactive terminal
		for _, response := range responses {
			fmt.Fprintln(ptmx, response)
			if err != nil {
				fmt.Printf("Error writing to %s stdin: %s\n", name, err)
				return
			}
			numResponses++
			// Waits briefly before next line
			time.Sleep(100 * time.Millisecond)
		}
	}()

	// Waits for cmd to terminate
	if err := cmd.Wait(); err != nil {
		fmt.Printf("Error waiting for %s: %s\n", name, err)
		return "", nil
	}

	fmt.Printf("%s Terminated.\n", name)

	return privateKey, nil
}

// Prints output from stream
func OutputStream(stream io.ReadCloser, name string) {
	scanner := bufio.NewScanner(stream)
	for scanner.Scan() {
		text := scanner.Text()
		fmt.Printf("%s> %s\n", name, text)
	}
}
