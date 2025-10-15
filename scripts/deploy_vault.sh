#!/bin/bash

# Deploy Vault Contract to Starknet
# This script compiles and deploys the Cairo vault contract

set -e

echo "🔨 Compiling Cairo contract..."
scarb build

echo "📦 Declaring contract..."
# Replace with your account address and private key
ACCOUNT_ADDRESS="${STARKNET_ACCOUNT_ADDRESS:-0x0}"
PRIVATE_KEY="${STARKNET_PRIVATE_KEY:-0x0}"

# Get the compiled contract artifact
CONTRACT_FILE="target/dev/vault_Vault.contract_class.json"

if [ ! -f "$CONTRACT_FILE" ]; then
    echo "❌ Contract artifact not found at $CONTRACT_FILE"
    exit 1
fi

echo "✅ Contract compiled successfully"

# Declare the contract (if not already declared)
echo "📝 Declaring contract class..."
CLASS_HASH=$(starkli declare $CONTRACT_FILE \
    --account $ACCOUNT_ADDRESS \
    --private-key $PRIVATE_KEY \
    --network sepolia 2>&1 | grep "Class hash declared" | awk '{print $NF}')

if [ -z "$CLASS_HASH" ]; then
    echo "⚠️  Class hash might already be declared. Continuing..."
    # Try to get class hash from existing declaration
    CLASS_HASH=$(starkli class-hash $CONTRACT_FILE)
fi

echo "✅ Class hash: $CLASS_HASH"

# Deploy the contract
echo "🚀 Deploying contract..."
# Constructor arguments: owner address (use the account address as owner)
DEPLOY_RESULT=$(starkli deploy $CLASS_HASH $ACCOUNT_ADDRESS \
    --account $ACCOUNT_ADDRESS \
    --private-key $PRIVATE_KEY \
    --network sepolia)

CONTRACT_ADDRESS=$(echo "$DEPLOY_RESULT" | grep "Contract deployed" | awk '{print $NF}')

echo "✅ Contract deployed successfully!"
echo "📍 Contract address: $CONTRACT_ADDRESS"
echo ""
echo "Save this address to your .env file:"
echo "VAULT_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"

# Save to .env.local
echo "VAULT_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> .env.local
echo "✅ Address saved to .env.local"
