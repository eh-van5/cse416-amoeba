package mine_test

import (
	//"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os/exec"
	"testing"
	"time"
)

func startServer() (*exec.Cmd, error) {
	// Run the main program (starts the HTTP server)
	cmd := exec.Command("go", "run", "../main.go") // Adjust the path as needed to run the main.go
	err := cmd.Start()
	if err != nil {
		return nil, fmt.Errorf("could not start server: %v", err)
	}
	return cmd, nil
}

func TestMineOneBlockAndStopMining(t *testing.T) {
	// Step 1: Start the server using the exec package
	cmd, err := startServer()
	if err != nil {
		t.Fatalf("Failed to start server: %v", err)
	}
	defer cmd.Process.Kill() // Ensure the process is killed after the test

	// Allow some time for the server to start up
	time.Sleep(10 * time.Second)

	// Step 2: Create a wallet
	username := "testuser"
	password := "testpassword"
	//createWalletURL := fmt.Sprintf("http://127.0.0.1/8000/createWallet/%s/%s", username, password) //wsl
	createWalletURL := fmt.Sprintf("http://localhost:8000/createWallet/%s/%s", username, password)
	resp, err := http.Get(createWalletURL)
	time.Sleep(5 * time.Second)

	if err != nil {
		t.Fatalf("Error creating wallet: %v", err)
	}
	defer resp.Body.Close()

	// Check the response for wallet creation
	body, _ := ioutil.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status OK, got %v. Response: %s", resp.Status, body)
	}

	//gotta log in first time
	logInURL := fmt.Sprintf("http://localhost:8000/login/%s/%s", username, password)
	resp, err = http.Get(logInURL)
	time.Sleep(5 * time.Second)
	if err != nil {
		t.Fatalf("Error logging in: %v", err)
	}
	defer resp.Body.Close()
	//generateAddressURL := fmt.Sprintf("http://127.0.0.1/8000/generateAddress") //wsl
	generateAddressURL := fmt.Sprintf("http://localhost:8000/generateAddress")
	resp, err = http.Get(generateAddressURL)
	if err != nil {
		t.Fatalf("Error generating address: %v", err)
	}
	defer resp.Body.Close()
	addr_resp := resp.Body

	// Check if the address is returned and is valid
	body, _ = ioutil.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status OK, got %v. Response: %s", resp.Status, body)
	}

	//stop server then restart btcd w/ address
	stopServerURL := fmt.Sprintf("http://localhost:8000/stopServer")
	resp, err = http.Get(stopServerURL)
	if err != nil {
		t.Fatalf("Error stopping server (1): %v", err)
	}
	defer resp.Body.Close()

	logInURL = fmt.Sprintf("http://localhost:8000/login/%s/%s/%s", username, password, addr_resp)
	resp, err = http.Get(logInURL)
	time.Sleep(5 * time.Second)
	if err != nil {
		t.Fatalf("Error logging in: %v", err)
	}
	defer resp.Body.Close()
	//CHECK for Wallet value

	checkBlockURL := fmt.Sprintf("http://localhost:8000/getWalletValue/%s/%s", username, password)

	resp, err = http.Get(checkBlockURL)
	if err != nil {
		t.Fatalf("Error Getting Wallet Value: %v", err)
	}
	fmt.Printf("Value of Wallet (Before Mining): %s\n", resp.Body)
	defer resp.Body.Close()

	// Step 4: Mine a block
	// Test the /mineOneBlock endpoint
	//mineBlockURL := "http://127.0.0.1/8000/startMining" //wsl
	mineBlockURL := fmt.Sprintf("http://localhost:8000/startMining/%s/%s", username, password)
	resp, err = http.Get(mineBlockURL)
	if err != nil {
		t.Fatalf("Error creating request for mine block: %v", err)
	}

	//respRecorder := httptest.NewRecorder()
	//http.DefaultServeMux.ServeHTTP(respRecorder, req)
	body, _ = ioutil.ReadAll(resp.Body)

	// Check the response after mining a block
	/*
		if respRecorder.Code != http.StatusOK {
			t.Errorf("Expected status OK, got %v", respRecorder.Code)
		}*/

	//print
	var mineResponse struct {
		BlockHash string `json:"blockHash"`
	}

	if err := json.Unmarshal(body, &mineResponse); err != nil {
		t.Fatalf("Error unmarshaling mine response: %v", err)
	}

	// Print the mined block hash
	if mineResponse.BlockHash != "" {
		fmt.Printf("Mined block hash: %s\n", mineResponse.BlockHash)
	} else {
		t.Errorf("No block hash found in the response")
	}
	//print end
	if err != nil {
		t.Fatalf("Error mining block: %v", err)
	}

	// Allow some time to simulate mining
	time.Sleep(5 * time.Second)
	defer resp.Body.Close()
	// Step 5: Stop mining
	//stopMiningURL := "http://127.0.0.1/8000/stopMining" //wsl
	stopMiningURL := fmt.Sprintf("http://localhost:8000/stopMining/%s/%s", username, password)
	resp, err = http.Get(stopMiningURL)
	if err != nil {
		t.Fatalf("Error creating request to stop mining: %v", err)
	}
	body, _ = ioutil.ReadAll(resp.Body)

	//respRecorder = httptest.NewRecorder()
	//http.DefaultServeMux.ServeHTTP(respRecorder, req)

	// Check the response after stopping mining
	/*
		if respRecorder.Code != http.StatusOK {
			t.Errorf("Expected status OK, got %v", respRecorder.Code)
		}*/
	if err != nil {
		t.Fatalf("Error mining block: %v", err)
	}
	defer resp.Body.Close()
	// Step 6: Check Value of Wallet after mining
	//checkBlockURL := fmt.Sprintf("http://localhost:8000/getWalletValue/%s/%s", username, password)

	resp, err = http.Get(checkBlockURL)
	if err != nil {
		t.Fatalf("Error Getting Wallet Value(After): %v", err)
	}
	fmt.Printf("Value of Wallet (After Mining): %s\n", resp.Body)
	defer resp.Body.Close()
}
