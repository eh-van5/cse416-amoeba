#!/bin/bash
# Wrapper script for btcd with specific flags
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BTCD_EXEC="${SCRIPT_DIR}/../coin/btcd/./btcd"

echo "Starting btcd wrapper script" >&2
"$BTCD_EXEC" --rpcuser=user --rpcpass=password --notls --debuglevel=info --generate"$@"
echo "btcd finished running" >&2