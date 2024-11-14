package main

import (
	"fmt"
	// "os"
	"os/exec"
)

func runCommand() {
	// Define the command with "bash", "-c", and the full path to the script
	cmd := exec.Command("/mnt/c/Users/Evan/Documents/SBU/2024Fall/CSE416/cse416-amoeba/my-app/src/scripts/btcd_wrapper.sh")

	output, err := cmd.Output()

	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println(string(output))
	}
}
