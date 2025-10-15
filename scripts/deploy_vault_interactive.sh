#!/bin/bash

# Deploy Vault Contract to Starknet using Starkli
# This script declares and deploys the Cairo vault contract

set -e

# Load Starkli environment
. /home/codespace/.starkli/env 2>/dev/null || true
export PATH="$HOME/.local/bin:$HOME/.starkli/bin:$PATH"

echo "🔨 Cairo Vault Contract Deployment"
echo "===================================="
echo ""

# Check if contract is compiled
CONTRACT_FILE="target/dev/vault_Vault.contract_class.json"
if [ ! -f "$CONTRACT_FILE" ]; then
    echo "❌ Contract not compiled. Building contract..."
    scarb build
fi

echo "✅ Contract artifact found: $CONTRACT_FILE"
echo ""

# Prompt for account details
echo "📝 Please provide your Starknet account details:"
echo ""
read -p "Enter your Braavos wallet address (0x...): " ACCOUNT_ADDRESS
read -sp "Enter your private key (0x...): " PRIVATE_KEY
echo ""
echo ""

# Validate inputs
if [ -z "$ACCOUNT_ADDRESS" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Account address and private key are required"
    exit 1
fi

# Set RPC URL for Sepolia testnet
RPC_URL="https://starknet-sepolia.public.blastapi.io/rpc/v0_7"

echo "🌐 Network: Starknet Sepolia Testnet"
echo "📍 RPC URL: $RPC_URL"
echo "👤 Account: $ACCOUNT_ADDRESS"
echo ""

# Step 1: Declare the contract
echo "📝 Step 1/2: Declaring contract class..."
echo ""

DECLARE_OUTPUT=$(starkli declare "$CONTRACT_FILE" \
    --rpc "$RPC_URL" \
    --account "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    2>&1 || true)

# Extract class hash from output
CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -oP 'Class hash declared: \K0x[a-fA-F0-9]+' || echo "$DECLARE_OUTPUT" | grep -oP 'Class hash: \K0x[a-fA-F0-9]+' || echo "")

if [ -z "$CLASS_HASH" ]; then
    echo "⚠️  Declaration might have failed or class already declared"
    echo "Output: $DECLARE_OUTPUT"
    echo ""
    echo "Calculating class hash from artifact..."
    CLASS_HASH=$(starkli class-hash "$CONTRACT_FILE")
fi

echo "✅ Class hash: $CLASS_HASH"
echo ""

# Step 2: Deploy the contract
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
    echo "❌ Deployment failed"
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

# Verify deployment
echo "🔍 Verifying deployment..."
OWNER_CHECK=$(starkli call "$CONTRACT_ADDRESS" get_owner --rpc "$RPC_URL" 2>&1 || echo "")

if [[ "$OWNER_CHECK" == *"$ACCOUNT_ADDRESS"* ]]; then
    echo "✅ Deployment verified! Contract owner matches."
else
    echo "⚠️  Could not verify owner (this is normal, contract might need to sync)"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Add NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS to your .env file"
echo "2. Authorize your ChipiPay wallet: starkli invoke $CONTRACT_ADDRESS authorize_hot <CHIPI_WALLET_ADDRESS>"
echo "3. Integrate the vault contract with your frontend"
echo ""
echo "See contracts/DEPLOYMENT.md for more details."
