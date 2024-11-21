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
```
cd my-app/src/backend/coin
go build
go run .
```

## Calling Commands
Once btcd and btcwallet have started, you can access its functionality by making HTTP requests to:
**http://localhost:8000/**

Currently, the server will process these requests:
/  test function that responds with "This is a message!"
/generateAddress  creates a new address for mining
