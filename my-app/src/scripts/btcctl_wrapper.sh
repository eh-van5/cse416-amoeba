#!/bin/bash
# Wrapper script for btcctl with specific flags
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BTCCTL_EXEC="${SCRIPT_DIR}/../coin/btcd/cmd/btcctl/./btcctl"

"$BTCCTL_EXEC" --rpcuser=user --rpcpass=password --rpcserver=127.0.0.1:8332 --notls --wallet "$@"
