# How to Deploy the Vault Contract with Braavos Wallet

## Option 1: Export Your Braavos Account (Recommended for Testing)

Since Braavos doesn't directly expose your private key for security reasons, you have a few options:

### Method A: Create a Test Deployment Account

The easiest way is to create a dedicated deployment account using Starknet Foundry:

```bash
# Install Starknet Foundry (sncast)
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
snfoundryup

# Create a new account for deployment
sncast account create --name deployer --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# Deploy the account
sncast account deploy --name deployer --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# Get account details
sncast account list
```

Then add to your `.env`:
```env
STARKNET_ACCOUNT_ADDRESS=0x...  # From sncast output
STARKNET_PRIVATE_KEY=0x...      # From ~/.starknet_accounts/starknet_open_zeppelin_accounts.json
```

### Method B: Use Braavos CLI Export (If Available)

If you have the Braavos browser extension, you can:

1. Open Braavos wallet
2. Go to Settings → Advanced → Export Private Key
3. **WARNING**: Only do this for test accounts! Never share your mainnet private key

### Method C: Use Contract Wallet Pattern (Most Secure)

Instead of using a private key, you can deploy using your browser wallet:

```bash
# This will use your browser's Braavos connection
npm run deploy:vault:browser
```

## Option 2: Use Pre-funded Test Account

For quick testing, you can use a test account I'll provide:

```bash
# Add to .env
STARKNET_ACCOUNT_ADDRESS=0x0736bf796e70dad68a103682720dafb090f50065821971b33cbeeb3e3ff5af9f
# Contact me for the test private key (for development only)
```

## Option 3: Deploy via TypeScript (Browser Wallet Integration)

The safest option - use your browser's Braavos wallet directly:

```typescript
// This script uses your connected browser wallet
npm run deploy:vault
```

This will:
1. Connect to your Braavos wallet via the browser
2. Request signature for contract declaration
3. Request signature for contract deployment
4. Save contract address to .env.local

## Recommended Approach

**For development/testing:**
1. Create a new test account with `sncast` (Method A)
2. Fund it with Sepolia testnet tokens from a faucet
3. Use it for contract deployment

**For production:**
1. Use a hardware wallet or secure key management
2. Deploy from a secure environment
3. Never expose private keys in code or logs

## Quick Start (Test Account)

```bash
# 1. Create test account
sncast account create --name vault_deployer

# 2. Get Sepolia ETH from faucet
# Visit: https://starknet-faucet.vercel.app/

# 3. Deploy account
sncast account deploy --name vault_deployer

# 4. Add credentials to .env
echo "STARKNET_ACCOUNT_ADDRESS=$(sncast account list | grep vault_deployer -A 1 | tail -1)" >> .env
echo "STARKNET_PRIVATE_KEY=..." >> .env  # Get from ~/.starknet_accounts/

# 5. Deploy vault
./scripts/deploy_vault_simple.sh
```

## Security Notes

- 🔐 Never commit private keys to Git
- 🛡️ Use test accounts for development
- ⚡ Always verify contract addresses after deployment
- 📊 Keep deployment logs for audit trails

## Need Help?

If you're stuck, you can:
1. Use the interactive TypeScript deployment (safest)
2. Create a test account specifically for this deployment
3. Contact the team for a pre-configured test account
