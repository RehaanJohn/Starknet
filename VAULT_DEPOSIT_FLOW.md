# 🏦 Vault Deposit & Balance Flow

## 📍 Vault Contract Address
```
0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07
```

## 🔄 Complete Flow

### Step 1: User Deposits STRK to Vault Contract

**User sends STRK tokens to the VAULT CONTRACT (not ChipiPay wallet!)**

```bash
# User transfers from their Braavos wallet TO the vault contract
# This should be done via Braavos UI or starkli:

starkli invoke \
    <STRK_TOKEN_ADDRESS> \
    transfer \
    0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
    <amount_low> \
    <amount_high> \
    --account <user_account> \
    --keystore <user_keystore>
```

**Example:** User deposits 100 STRK:
- Amount in wei: 100 * 10^18 = 100000000000000000000
- In hex: 0x56bc75e2d63100000
- Low: 0x56bc75e2d63100000
- High: 0x0

---

### Step 2: Owner Credits User's Vault Balance

**After confirming the deposit, YOU (owner) update the internal ledger:**

```bash
# Check current balance first
starkli call \
    0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
    get_chipi_balance \
    <user_braavos_address> \
    --rpc https://starknet-sepolia.public.blastapi.io

# Set/update the balance in the vault ledger
starkli invoke \
    0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
    set_chipi_balance \
    <user_braavos_address> \
    <amount_low> \
    <amount_high> \
    --rpc https://starknet-sepolia.public.blastapi.io \
    --account ~/.starkli-wallets/deployer-new/account.json \
    --keystore ~/.starkli-wallets/deployer-new/keystore.json
```

**Example:** Credit user's address with 100 tokens:
```bash
starkli invoke \
    0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
    set_chipi_balance \
    0x03a50aF4b813776EE8BFA7caF1f8D8bb4738b7a43981083Dd64D4aACBe9230F8 \
    100 \
    0 \
    --rpc https://starknet-sepolia.public.blastapi.io \
    --account ~/.starkli-wallets/deployer-new/account.json \
    --keystore ~/.starkli-wallets/deployer-new/keystore.json
```

---

### Step 3: UI Shows Balance from Vault

**The frontend calls `/api/vault/balance?address=<user_address>`**

```typescript
// This reads from the vault's internal ledger
const response = await fetch(`/api/vault/balance?address=${userAddress}`);
const data = await response.json();
// Returns: { balance_low: "100", balance_high: "0" }
```

---

## 🎯 Key Points

1. **STRK tokens are held BY THE VAULT CONTRACT**
   - Not in ChipiPay wallet
   - Not in any user wallet
   - In the vault contract itself

2. **ChipiPay balance = Vault ledger balance**
   - The vault contract tracks balances internally
   - `get_chipi_balance()` reads from this ledger
   - This is NOT the wallet's native balance

3. **Owner must authorize hot wallet ONCE**
   ```bash
   # One-time setup
   starkli invoke \
       0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
       authorize_hot \
       0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926 \
       --rpc https://starknet-sepolia.public.blastapi.io \
       --account ~/.starkli-wallets/deployer-new/account.json \
       --keystore ~/.starkli-wallets/deployer-new/keystore.json
   ```

4. **Withdrawals work via hot wallet**
   - ChipiPay hot wallet calls `withdraw_by_hot()`
   - Vault checks authorization + balance
   - Emits event
   - Your backend sends real STRK to user

---

## 🧪 Testing Commands

### Test 1: Check if hot wallet is authorized
```bash
starkli call \
    0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
    get_hot_wallet \
    --rpc https://starknet-sepolia.public.blastapi.io
```
**Expected:** `0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926`

### Test 2: Check vault owner
```bash
starkli call \
    0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
    get_owner \
    --rpc https://starknet-sepolia.public.blastapi.io
```
**Expected:** Your deployer address

### Test 3: Check a user's balance
```bash
starkli call \
    0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
    get_chipi_balance \
    <user_braavos_address> \
    --rpc https://starknet-sepolia.public.blastapi.io
```

### Test 4: Set balance for testing
```bash
# Give yourself 1000 tokens for testing
starkli invoke \
    0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
    set_chipi_balance \
    <YOUR_BRAAVOS_ADDRESS> \
    1000 \
    0 \
    --rpc https://starknet-sepolia.public.blastapi.io \
    --account ~/.starkli-wallets/deployer-new/account.json \
    --keystore ~/.starkli-wallets/deployer-new/keystore.json

# Wait 30 seconds for confirmation
sleep 30

# Verify
starkli call \
    0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 \
    get_chipi_balance \
    <YOUR_BRAAVOS_ADDRESS> \
    --rpc https://starknet-sepolia.public.blastapi.io
```

---

## 📊 Architecture Diagram

```
┌─────────────┐
│ User Wallet │ 
│  (Braavos)  │
└──────┬──────┘
       │ 1. Transfer STRK
       ▼
┌─────────────────┐
│ Vault Contract  │◄─── 2. Owner sets balance
│  (Holds STRK)   │
│                 │
│ Internal Ledger:│
│  user1: 100     │
│  user2: 500     │
└─────────────────┘
       ▲
       │ 3. Read balance
       │
┌──────────────┐
│  UI/Frontend │
│ (Your Dapp)  │
└──────────────┘
```

---

## ✅ Quick Setup Checklist

- [ ] Authorize ChipiPay hot wallet (run once)
- [ ] User transfers STRK to vault contract
- [ ] Owner calls `set_chipi_balance` to credit user
- [ ] UI fetches balance via `/api/vault/balance`
- [ ] Balance shows in "ChipiPay Vault" card

---

## 🚨 Important Notes

1. **The vault is NOT a wallet** - it's a permission system + ledger
2. **Actual STRK tokens** should be in the vault contract address
3. **Users send TO vault**, not to ChipiPay wallet
4. **Owner updates ledger** after confirming deposit
5. **UI reads from ledger**, not from wallet balance
