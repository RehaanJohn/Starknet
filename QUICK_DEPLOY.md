# Quick Deployment Guide - Use Pre-configured Test Wallet

Since Braavos doesn't expose private keys directly, here's the quickest way to deploy:

## ⚡ Quick Start (Recommended)

### Step 1: Add Test Wallet to .env

Add these lines to your `.env` file:

```bash
# Test deployment wallet (Sepolia testnet only - safe for development)
STARKNET_ACCOUNT_ADDRESS=0x0736bf796e70dad68a103682720dafb090f50065821971b33cbeeb3e3ff5af9f
# For the private key, you'll need to fund this account or use your own test account
```

### Step 2: Get Test Funds

Visit Starknet Sepolia faucet to get test ETH:
- https://starknet-faucet.vercel.app/
- https://faucet.goerli.starknet.io/

### Step 3: Create Your Own Test Account (Safest)

```bash
# Install Starknet Foundry
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
source ~/.bashrc

# Create deployment account
sncast account create \
  --name vault_deployer \
  --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# This will output your new account address and save the private key
# Example output:
# Account created successfully
# Address: 0x1234...
# Public key: 0x5678...

# Deploy the account (you'll need some test ETH first)
sncast account deploy \
  --name vault_deployer \
  --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
  --fee-token eth
```

### Step 4: Add Credentials to .env

```bash
# Get your account info
sncast account list

# Add to .env (replace with your actual values)
echo "STARKNET_ACCOUNT_ADDRESS=0x..." >> .env
echo "STARKNET_PRIVATE_KEY=0x..." >> .env
```

The private key is stored in: `~/.starknet_accounts/starknet_open_zeppelin_accounts.json`

### Step 5: Deploy the Vault Contract

```bash
chmod +x scripts/deploy_vault_simple.sh
./scripts/deploy_vault_simple.sh
```

## 🎯 Alternative: Manual Deployment with Starkli

If you prefer manual control:

```bash
# 1. Calculate class hash
starkli class-hash target/dev/vault_Vault.contract_class.json

# 2. Declare contract
starkli declare target/dev/vault_Vault.contract_class.json \
  --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
  --account $STARKNET_ACCOUNT_ADDRESS \
  --private-key $STARKNET_PRIVATE_KEY

# 3. Deploy contract (use class hash from step 1 and your address as owner)
starkli deploy <CLASS_HASH> $STARKNET_ACCOUNT_ADDRESS \
  --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
  --account $STARKNET_ACCOUNT_ADDRESS \
  --private-key $STARKNET_PRIVATE_KEY
```

## 📋 What You'll Get

After deployment, you'll receive:
- ✅ Contract Address (e.g., `0xabc123...`)
- ✅ Class Hash
- ✅ Owner Address (your account)

Save the contract address to `.env`:
```env
NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS=0x...
```

## 🔒 Security Notes

- ✅ This test account is ONLY for Sepolia testnet
- ✅ Never use test account private keys on mainnet
- ✅ Never commit private keys to Git (already in .gitignore)

## ❓ Need Help?

If you get stuck:
1. Make sure you have test ETH in your account
2. Check that Starkli and Scarb are installed
3. Verify the contract compiled successfully (`scarb build`)
4. Check RPC connection to Sepolia testnet

Ready to deploy? Run:
```bash
./scripts/deploy_vault_simple.sh
```
