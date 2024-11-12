#!/bin/bash
# Wrapper script for btcd with specific flags

/mnt/c/Users/Evan/Documents/SBU/2024Fall/CSE416/cse416-amoeba/my-app/src/coin/btcwallet/./btcwallet --btcdusername=user --btcdpassword=password --rpcconnect=127.0.0.1:8334  --noclienttls --noservertls --username=user --password=password "$@"