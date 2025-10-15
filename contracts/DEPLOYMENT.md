# Cairo Vault Contract Deployment Guide

## Overview
This Cairo vault contract provides secure on-chain management for Braavos → ChipiPay wallet transfers with the following features:

- ✅ **Authorized hot wallet transfers** (`authorize_hot`)
- ✅ **Hot wallet withdrawals with balance limits** (`withdraw_by_hot`)
- ✅ **Revoking hot wallet access** (`revoke`)
- ✅ **Emergency freeze/unfreeze** (`freeze`, `unfreeze`)
- ✅ **Balance tracking** (`get_chipi_balance`, `set_chipi_balance`)

## Prerequisites

### 1. Install Scarb (Cairo compiler)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
```

### 2. Install Starkli (Starknet CLI)
```bash
curl https://get.starkli.sh | sh
starkliup
```

### 3. Setup Starknet Account
You'll need a Starknet account with some ETH for deployment fees. You can:
- Use an existing Braavos/Argent wallet
- Create a new account using Starkli

## Deployment Steps

### Option 1: Using Bash Script (Recommended)

1. **Set environment variables:**
```bash
export STARKNET_ACCOUNT_ADDRESS="0x..."  # Your Braavos wallet address
export STARKNET_PRIVATE_KEY="0x..."      # Your private key
```

2. **Run the deployment script:**
```bash
cd /workspaces/Starknet
./scripts/deploy_vault.sh
```

3. **Save the contract address** from the output to your `.env` file

### Option 2: Using TypeScript Script

1. **Install dependencies:**
```bash
npm install starknet dotenv
```

2. **Add to `.env`:**
```env
STARKNET_ACCOUNT_ADDRESS=0x...
STARKNET_PRIVATE_KEY=0x...
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
```

3. **Run the deployment script:**
```bash
npm run deploy:vault
# or
npx ts-node scripts/deploy_vault.ts
```

### Option 3: Manual Deployment

1. **Build the contract:**
```bash
scarb build
```

2. **Declare the contract:**
```bash
starkli declare target/dev/vault_Vault.contract_class.json \
  --account ~/.starkli-wallets/deployer/account.json \
  --keystore ~/.starkli-wallets/deployer/keystore.json \
  --network sepolia
```

3. **Deploy the contract:**
```bash
starkli deploy <CLASS_HASH> <OWNER_ADDRESS> \
  --account ~/.starkli-wallets/deployer/account.json \
  --keystore ~/.starkli-wallets/deployer/keystore.json \
  --network sepolia
```

## Post-Deployment

### 1. Add Contract Address to .env
```env
VAULT_CONTRACT_ADDRESS=0x...
```

### 2. Verify Deployment
```bash
# Check owner
starkli call $VAULT_CONTRACT_ADDRESS get_owner --network sepolia

# Check if frozen
starkli call $VAULT_CONTRACT_ADDRESS is_frozen --network sepolia
```

### 3. Authorize ChipiPay Hot Wallet
```bash
starkli invoke $VAULT_CONTRACT_ADDRESS authorize_hot <CHIPI_WALLET_ADDRESS> \
  --account ~/.starkli-wallets/deployer/account.json \
  --keystore ~/.starkli-wallets/deployer/keystore.json \
  --network sepolia
```

## Contract Functions

### Owner-Only Functions
- `authorize_hot(hot: ContractAddress)` - Authorize a hot wallet
- `revoke()` - Revoke hot wallet access
- `freeze()` - Emergency freeze all withdrawals
- `unfreeze()` - Unfreeze withdrawals
- `set_chipi_balance(user, amount_low, amount_high)` - Set balance for tracking

### Hot Wallet Functions
- `withdraw_by_hot(to, amount_low, amount_high)` - Withdraw funds (if authorized)

### View Functions
- `get_owner()` - Get contract owner
- `get_hot_wallet()` - Get authorized hot wallet
- `is_frozen()` - Check if vault is frozen
- `get_chipi_balance(user)` - Get tracked balance for user

## Integration with Frontend

After deployment, update your frontend code to interact with the vault:

```typescript
import { Contract } from 'starknet';

const vaultAbi = [...]; // Import from compiled contract
const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;

const vaultContract = new Contract(vaultAbi, vaultAddress, provider);

// Check balance before transfer
const { low, high } = await vaultContract.get_chipi_balance(userAddress);
if (BigInt(low) < transferAmount) {
  throw new Error('Insufficient ChipiPay balance');
}

// Execute transfer
await vaultContract.withdraw_by_hot(recipientAddress, amountLow, amountHigh);
```

## Security Notes

- 🔐 Keep your private key secure - never commit it to Git
- 🛡️ The vault owner can authorize/revoke hot wallets and freeze operations
- ⚡ Hot wallets can only withdraw if authorized and vault is not frozen
- 📊 Balance tracking is on-chain and immutable (owner-controlled updates only)

## Troubleshooting

### "Account not found" error
Make sure your account is deployed and funded with ETH

### "Class already declared" warning
This is normal - the script will continue with the existing class hash

### "Insufficient balance" error
Ensure your account has enough ETH for gas fees

## Next Steps

1. ✅ Deploy the contract
2. ✅ Authorize your ChipiPay wallet
3. ✅ Update frontend to use vault contract
4. ✅ Test emergency freeze/unfreeze
5. ✅ Integrate with `BraavosToChipiTransfer` component
