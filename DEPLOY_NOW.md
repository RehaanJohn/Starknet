# 🚀 Deploy Your Vault Contract - Simple Guide

## ✅ Your Contract is Ready!

The Cairo vault contract has been **compiled successfully** and is ready to deploy.

## 📝 Step-by-Step Deployment

### Step 1: Fill in Your Deployment Credentials

Open `.env` file and fill in these two values:

```env
STARKNET_ACCOUNT_ADDRESS=    # ← Add your Starknet address here
STARKNET_PRIVATE_KEY=        # ← Add your private key here
```

### Step 2: Get Your Credentials

#### Option A: Create a New Test Account (Recommended)

```bash
# 1. Install Starknet Foundry
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
source ~/.bashrc

# 2. Create a deployment account
sncast account create --name vault_deployer --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# Output will show:
# Address: 0x... ← Copy this to STARKNET_ACCOUNT_ADDRESS
# The private key is saved automatically

# 3. Get the private key
cat ~/.starknet_accounts/starknet_open_zeppelin_accounts.json
# Copy the "private_key" value to STARKNET_PRIVATE_KEY

# 4. Get test funds
# Visit: https://starknet-faucet.vercel.app/
# Paste your address from step 2

# 5. Deploy your account to Starknet
sncast account deploy --name vault_deployer --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7 --fee-token eth
```

#### Option B: Use Your Existing Braavos Test Account

If you have a Braavos test account, you can export it:
1. Open Braavos → Settings → Advanced → Export Private Key
2. **WARNING: Only for test accounts!**

### Step 3: Deploy the Contract

Once your `.env` is filled:

```bash
./scripts/deploy_vault_simple.sh
```

That's it! 🎉

## 🔍 What Happens During Deployment

1. ✅ Validates your credentials
2. ✅ Declares the contract class on Starknet
3. ✅ Deploys the vault contract
4. ✅ Saves the contract address to `.env.local`
5. ✅ Verifies the deployment

## 📋 After Deployment

You'll see output like:

```
================================================
📍 CONTRACT ADDRESS: 0xabc123...
🔑 CLASS HASH: 0xdef456...
👤 OWNER: 0x789...
================================================
```

The contract address will be automatically saved to `.env.local` as:
```env
NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS=0xabc123...
```

## 🔐 Security Checklist

- ✅ Only use Sepolia testnet credentials
- ✅ Never commit `.env` to Git (already in .gitignore)
- ✅ Keep private keys secure
- ✅ Verify contract address after deployment

## ❓ Troubleshooting

### "Account not found" error
- Make sure you deployed your account (step 2.5)
- Verify you have test ETH in your account

### "Insufficient balance" error
- Get more test ETH from the faucet
- Wait a few minutes for faucet transaction to confirm

### "Class already declared" warning
- This is normal! The script will continue with the existing class

### "Contract compiled but not found"
- Run: `export PATH="$HOME/.local/bin:$PATH" && scarb build`

## 📚 Files You Need

- ✅ `.env` - Your deployment credentials (FILL THIS!)
- ✅ `scripts/deploy_vault_simple.sh` - Deployment script (ready)
- ✅ `target/dev/vault_Vault.contract_class.json` - Compiled contract (ready)

## 🎯 Quick Command Reference

```bash
# Check if compiled
ls target/dev/vault_Vault.contract_class.json

# Deploy
./scripts/deploy_vault_simple.sh

# Verify deployment
starkli call $NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS get_owner --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7
```

## 🆘 Need Help?

If you get stuck:
1. Check `.env` is filled correctly
2. Verify you have test ETH
3. Make sure Starkli is installed: `starkli --version`
4. Check Scarb is installed: `scarb --version`

---

**Ready to deploy?**

1. Fill in `.env`
2. Run: `./scripts/deploy_vault_simple.sh`
3. Done! 🎉
