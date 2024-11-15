package main

func main() {
	// StartBtcd()
	// StartWallet("pass2")
	// CreateWallet("pass1", "pass2")
	RunBtcCommand("addnode 127.0.0.1 add")
	RunBtcCommand("getpeerinfo")
}

// Running btcd for the first time
// Starts btcd 						> btcd
// Creates wallet 					> btcwallet --create
// Starts wallet with password		> btcwallet --walletpass=[password]
// Retrieves new wallet address		> btcctl getnewaddress
// Restarts btcd with new address	> btcd --miningaddr=[address]
// Restarts btcwallet				> btcwallet --walletpass=[password]
func Start() {
	// go
}
