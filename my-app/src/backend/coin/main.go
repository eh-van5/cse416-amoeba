package main

import (
	"fmt"
	"os"
	"os/exec"
	"bufio"
)

func main() {
	runCommand()
	// fmt.Println("Hello")
}

func runCommand() {
	if _, err := os.Stat("../../scripts/btcd_wrapper.sh"); err == nil {
		fmt.Println("File exists")
	}
	// Define the command with "bash", "-c", and the full path to the script
	cmd := exec.Command("../../scripts/btcd_wrapper.sh")

	output, err := cmd.StdoutPipe()

	if err != nil {
		fmt.Println("Error reading btcd stdout:", err)
	}

	fmt.Println("Reading stdout")
	scanner := bufio.NewScanner(output)
	for scanner.Scan() {
		fmt.Printf("[btcd] %s\n", scanner.Text())
	}
}
