#!/bin/bash
# Wrapper script for btcd with specific flags
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BTCWALLET_EXEC="${SCRIPT_DIR}/../coin/btcwallet/./btcwallet"

echo "Starting btcwallet wrapper script" >&2
"$BTCWALLET_EXEC" --btcdusername=user --btcdpassword=password --rpcconnect=127.0.0.1:8334  --noclienttls --noservertls --username=user --password=password "$@"
echo "btcwallet finished running" >&2