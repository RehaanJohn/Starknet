#!/bin/bash
# Vault Contract Deployment using Starkli with Keystore
set -e

# Load Starkli environment
. /home/codespace/.starkli/env 2>/dev/null || true
export PATH="$HOME/.local/bin:$HOME/.starkli/bin:$PATH"

echo "🔨 Cairo Vault Contract Deployment"
echo "===================================="
echo ""

# Load .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if contract is compiled
CONTRACT_FILE="target/dev/vault_Vault.contract_class.json"
if [ ! -f "$CONTRACT_FILE" ]; then
    echo "❌ Contract not compiled. Building contract..."
    scarb build
fi

echo "✅ Contract artifact found: $CONTRACT_FILE"
echo ""

# Set paths for account and keystore
ACCOUNT_FILE="$HOME/.starkli-wallets/deployer/account.json"
KEYSTORE_FILE="$HOME/.starkli-wallets/deployer/keystore.json"

# Verify files exist
if [ ! -f "$ACCOUNT_FILE" ]; then
    echo "❌ Account file not found at $ACCOUNT_FILE"
    exit 1
fi

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "❌ Keystore file not found at $KEYSTORE_FILE"
    exit 1
fi

# Set RPC URL for Sepolia testnet
RPC_URL="${STARKNET_RPC_URL:-https://starknet-sepolia.public.blastapi.io/rpc/v0_7}"
ACCOUNT_ADDRESS="${STARKNET_ACCOUNT_ADDRESS}"

echo "🌐 Network: Starknet Sepolia Testnet"
echo "📍 RPC URL: $RPC_URL"
echo "�� Account: $ACCOUNT_ADDRESS"
echo ""

# Step 1: Get class hash
echo "📝 Step 1/2: Getting class hash..."
CLASS_HASH=$(starkli class-hash "$CONTRACT_FILE")
echo "✅ Class hash: $CLASS_HASH"
echo ""

# Step 2: Declare (if needed)
echo "📝 Declaring contract class (if not already declared)..."
starkli declare "$CONTRACT_FILE" \
    --rpc "$RPC_URL" \
    --account "$ACCOUNT_FILE" \
    --keystore "$KEYSTORE_FILE" \
    2>&1 || echo "⚠️  Class might already be declared, continuing..."

echo ""

# Step 3: Deploy
echo "🚀 Step 2/2: Deploying contract..."
echo "   Constructor argument: $ACCOUNT_ADDRESS (owner)"
echo ""

starkli deploy "$CLASS_HASH" "$ACCOUNT_ADDRESS" \
    --rpc "$RPC_URL" \
    --account "$ACCOUNT_FILE" \
    --keystore "$KEYSTORE_FILE"

