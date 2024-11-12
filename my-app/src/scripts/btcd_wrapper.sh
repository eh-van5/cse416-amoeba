#!/bin/bash
# Wrapper script for btcd with specific flags

echo "Starting btcd wrapper script" >&2
/mnt/c/Users/Evan/Documents/SBU/2024Fall/CSE416/cse416-amoeba/my-app/src/coin/btcd/./btcd --rpcuser=user --rpcpass=password --notls --debuglevel=info "$@"
echo "btcd finished running" >&2