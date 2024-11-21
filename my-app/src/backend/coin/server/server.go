package server

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/creack/pty"
)

// Starts the btcd process
// miningAddress is used for mining, obtained by calling GetNewAdrress
func StartBtcd(miningAddress string, sigchan chan os.Signal) {
	name := "btcd"
	fmt.Printf("Starting %s...\n", name)

	// Gets path to executable file and arguments to pass into it
	executable := "../../coin/btcd/./btcd"
	args := []string{
		"--rpcuser=user",
		"--rpcpass=password",
		"--notls",
		"--debuglevel=info",
	}

	// If a mining address is given
	if miningAddress != "" {
		args = append(args, "--miningaddr="+miningAddress)
	}

	cmd := exec.Command(executable, args...)

	// Gets output stream of process
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Printf("Error getting %s stdout: %s\n", name, err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		fmt.Printf("Error reading %s stderr: %s\n", name, err)
	}

	// Starts running command
	if err := cmd.Start(); err != nil {
		fmt.Println("Error starting cmd: ", err)
	}

	// Print
	go OutputStream(stdout, name)
	go OutputStream(stderr, name)

	// Waits for cmd to terminate
	// if err := cmd.Wait(); err != nil {
	// 	fmt.Printf("Error waiting for %s: %s\n", name, err)
	// }
	go func() {
		<-sigchan
		fmt.Printf("%s Terminated.\n", name)
		cmd.Process.Signal(os.Kill)
	}()
}

// Starts the btcwallet process
// Assumes that wallet already exists
func StartWallet(walletpass string, sigchan chan os.Signal) {
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
	fmt.Printf("Before command init\n")
	cmd := exec.Command(executable, args...)

	fmt.Printf("After command init\n")
	// Gets output stream of process
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Printf("Error getting %s stdout: %s\n", name, err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		fmt.Printf("Error getting %s stderr: %s\n", name, err)
	}
	fmt.Printf("Before start\n")

	// Starts running command
	if err := cmd.Start(); err != nil {
		fmt.Printf("Error starting %s: %s\n", name, err)
	}

	fmt.Printf("After start\n")
	// Print
	go OutputStream(stdout, name)
	go OutputStream(stderr, name)

	// Waits for cmd to terminate
	// if err := cmd.Wait(); err != nil {
	// 	fmt.Printf("Error waiting for %s to exit: %s\n", name, err)
	// }
	fmt.Printf("Wait term\n")
	go func() {
		<-sigchan
		fmt.Printf("%s Terminated.\n", name)
		cmd.Process.Signal(os.Kill)
	}()

}

// Starts btcwallet to create a wallet
// Typically used when calling btcwallet for the first time
func CreateWallet(privatepass string, publicpass string) (privateKey string, err error) {
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
		privatepass, // Enter the private passphrase for your new wallet
		privatepass, // Confirm passphrase
		"yes",       // Do you want to add an additional layer of encryption for public data? (n/no/y/yes) [no]
		publicpass,  // Enter the public passphrase for your new wallet
		publicpass,  // Confirm passphrase
		"no",        // Do you have an existing wallet seed you want to use? (n/no/y/yes) [no]
		"OK",        // Once you have stored the seed in a safe and secure location, enter "OK" to continue
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

// // Runs btcctl commands
// func RunBtcCommand(command string) {
// 	name := "btcctl"

// 	fmt.Printf("%s %s\n", name, command)
// 	// Gets path to command
// 	executable := "../../coin/btcd/cmd/btcctl/./btcctl"
// 	// Parses command string into multiple arguments
// 	args := []string{
// 		"--rpcuser=user",
// 		"--rpcpass=password",
// 		"--rpcserver=127.0.0.1:8332",
// 		"--notls",
// 		"--wallet",
// 	}

// 	args = append(args, strings.Split(command, " ")...)

// 	cmd := exec.Command(executable, args...)

// 	// Gets stdout and stderr of cmd
// 	stdout, err := cmd.StdoutPipe()
// 	if err != nil {
// 		fmt.Printf("Error getting %s stdout: %s\n", name, err)
// 	}
// 	stderr, err := cmd.StderrPipe()
// 	if err != nil {
// 		fmt.Printf("Error getting %s stderr: %s\n", name, err)
// 	}

// 	if err := cmd.Start(); err != nil {
// 		fmt.Printf("Error starting %s\n", name)
// 	}

// 	go OutputStream(stdout, name)
// 	go OutputStream(stderr, name)

// 	// Waits for cmd to terminate
// 	if err := cmd.Wait(); err != nil {
// 		fmt.Printf("Error waiting for %s: %s", name, err)
// 	}
// }

// OLD CODE *******
// Runs a command
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

// Prints output from stream
func OutputStream(stream io.ReadCloser, name string) {
	scanner := bufio.NewScanner(stream)
	for scanner.Scan() {
		fmt.Printf("%s> %s\n", name, scanner.Text())
	}
}
