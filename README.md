# cse416-amoeba
peer-to-peer file-sharing network

# To Initialize
```
cd my-app
npm install
```

# To Run
```
npm start
```

# Start btcd and wallet

Clone the btcd and btcwallet repos
```
cd my-app/src/coin
git clone https://github.com/prithesh07/btcd.git
git clone https://github.com/tahsina13/btcwallet.git
```

Build executables in each of the two repositories
```
cd my-app/src/coin/btcd
go build
```
```
cd my-app/src/coin/btcwallet
go build
```

## Run backend server
```
cd my-app/src/backend/coin
go build
go run .
```
