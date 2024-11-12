#!/bin/bash
# Wrapper script for btcctl with specific flags

/mnt/c/Users/Evan/Documents/SBU/2024Fall/CSE416/cse416-amoeba/my-app/src/coin/btcd/cmd/btcctl/./btcctl --rpcuser=user --rpcpass=password --rpcserver=127.0.0.1:8332 --notls --wallet "$@"
