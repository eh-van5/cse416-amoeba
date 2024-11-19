package api

/*
Creates a new wallet in btcwallet
Creates wallet 					> btcwallet --create
Starts wallet with password		> btcwallet --walletpass=[password]
Retrieves new wallet address	> btcctl getnewaddress

Params: wallet private pass, wallet public pass
Returns: private key, wallet address
[Wallet public pass is the password used to login to the app]
*/
func CreateWallet(privatepass string, publicpass string) {
	// go
}

// Starts btcd
// Restarts btcd with new address	> btcd --miningaddr=[address]
// Restarts btcwallet				> btcwallet --walletpass=[password]
func StartBtcd(address string, password string) {
	//go
}
