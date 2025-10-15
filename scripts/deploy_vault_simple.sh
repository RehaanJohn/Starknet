#!/bin/bash

# Simple Vault Contract Deployment using Environment Variables
# Set your credentials in .env file before running this script

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

# Use environment variables or prompt
ACCOUNT_ADDRESS="${STARKNET_ACCOUNT_ADDRESS:-}"
PRIVATE_KEY="${STARKNET_PRIVATE_KEY:-}"

if [ -z "$ACCOUNT_ADDRESS" ]; then
    # Try to use Braavos wallet address from connected wallet
    # For now, use a test deployment wallet
    echo "⚠️  No STARKNET_ACCOUNT_ADDRESS found in environment"
    echo "📝 Please add to your .env file:"
    echo "   STARKNET_ACCOUNT_ADDRESS=0x..."
    echo "   STARKNET_PRIVATE_KEY=0x..."
    echo ""
    echo "🔧 Alternative: Use Starknet Foundry to create a test account:"
    echo "   sncast account create --name deployer"
    echo ""
    exit 1
fi

# Set RPC URL for Sepolia testnet
RPC_URL="${STARKNET_RPC_URL:-https://starknet-sepolia.public.blastapi.io/rpc/v0_7}"

echo "🌐 Network: Starknet Sepolia Testnet"
echo "📍 RPC URL: $RPC_URL"
echo "👤 Account: $ACCOUNT_ADDRESS"
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
    --account "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    2>&1 || echo "⚠️  Class might already be declared, continuing..."
echo ""

# Step 3: Deploy
echo "🚀 Step 2/2: Deploying contract..."
echo "   Constructor argument: $ACCOUNT_ADDRESS (owner)"
echo ""

DEPLOY_OUTPUT=$(starkli deploy "$CLASS_HASH" "$ACCOUNT_ADDRESS" \
    --rpc "$RPC_URL" \
    --account "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    2>&1)

# Extract contract address
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP 'Contract deployed: \K0x[a-fA-F0-9]+' || echo "")

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Deployment failed or address not found"
    echo "Output: $DEPLOY_OUTPUT"
    exit 1
fi

echo ""
echo "✅ Contract deployed successfully!"
echo ""
echo "================================================"
echo "📍 CONTRACT ADDRESS: $CONTRACT_ADDRESS"
echo "🔑 CLASS HASH: $CLASS_HASH"
echo "👤 OWNER: $ACCOUNT_ADDRESS"
echo "================================================"
echo ""

# Save to .env.local
echo "💾 Saving contract address to .env.local..."
echo "" >> .env.local
echo "# Vault Contract (Deployed $(date))" >> .env.local
echo "NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> .env.local
echo "VAULT_CLASS_HASH=$CLASS_HASH" >> .env.local
echo ""
echo "✅ Configuration saved to .env.local"
echo ""

echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy the contract address to your .env file"
echo "2. Authorize your ChipiPay wallet:"
echo "   starkli invoke $CONTRACT_ADDRESS authorize_hot <CHIPI_WALLET_ADDRESS> --rpc $RPC_URL"
echo ""
