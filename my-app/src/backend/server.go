package main

import (
	"fmt"
	"os/exec"
)

func runCommand() {
	cmd := exec.Command("btcd")
	output, err := cmd.Output()

	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println(string(output))
	}
}
