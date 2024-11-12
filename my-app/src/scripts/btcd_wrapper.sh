#!/bin/bash
# Wrapper script for btcd with specific flags

/mnt/c/Users/Evan/Documents/SBU/2024Fall/CSE416/cse416-amoeba/my-app/src/coin/btcd/./btcd --rpcuser=user --rpcpass=password --notls --debuglevel=info --miningaddr=1ANiT1wNVVPrnHyafGDpvtnYJHVUpZ6n1t "$@"
