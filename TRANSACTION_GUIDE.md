# 💳 Transaction Features Guide

## 🎯 Available Transaction Methods

Your Nimbus app now has full transaction capabilities! Here's everything you can do:

---

## 1. 📥 DEPOSIT (Braavos → Vault)

### What It Does:
Transfers STRK tokens from your Braavos wallet to the Vault contract for safekeeping.

### How To Use:
1. **Click "Deposit" tab** in Transaction Panel
2. **Enter amount** (e.g., 10 STRK)
3. **Click "Deposit to Vault"**
4. **Approve in Braavos** wallet extension
5. **Wait for confirmation**
6. **Contact admin** to credit your vault balance

### Technical Flow:
```
User Braavos Wallet
       │
       │ 1. Transfer STRK
       ▼
 Vault Contract
 (Holds tokens)
       │
       │ 2. Admin calls set_chipi_balance
       ▼
 Vault Ledger
 (Records balance)
       │
       │ 3. UI reads balance
       ▼
   Dashboard
 (Shows balance)
```

### Command:
```javascript
// Executed by Braavos wallet
transfer(
  recipient: VAULT_CONTRACT,
  amount: amount_in_wei
)
```

### Example Transaction:
```bash
# User deposits 100 STRK
Amount: 100 STRK
To: 0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07 (Vault)
From: 0x57d0...6473 (Your Braavos)
Gas: ~0.001 STRK

# Then admin credits:
./vault-commands.sh set 0x57d0...6473 100
```

---

## 2. 📤 WITHDRAW (Vault → Braavos)

### What It Does:
Requests STRK tokens from your vault balance to be sent back to your Braavos wallet.

### How To Use:
1. **Click "Withdraw" tab** in Transaction Panel
2. **Enter amount** (must be ≤ vault balance)
3. **Click "Withdraw to Braavos"**
4. **Wait for API processing**
5. **Check Braavos wallet** for received STRK

### Technical Flow:
```
User clicks Withdraw
       │
       │ 1. POST /api/vault/withdraw
       ▼
  API Route
  (Server-side)
       │
       │ 2. Calls withdraw_by_hot()
       ▼
 Vault Contract
 (Checks balance & auth)
       │
       │ 3. Emits event
       ▼
  Hot Wallet
 (Executes transfer)
       │
       │ 4. Transfer STRK
       ▼
User Braavos Wallet
 (Receives tokens)
```

### API Endpoint:
```typescript
POST /api/vault/withdraw
Body: {
  to: "0x57d0...6473",  // Your Braavos address
  amount: 50            // Amount in STRK
}
```

### Response:
```json
{
  "success": true,
  "transaction_hash": "0x123abc...",
  "amount": "50",
  "recipient": "0x57d0...6473"
}
```

---

## 3. 🔍 VIEW BALANCES (Real-time)

### Available Balance Views:

#### Braavos Wallet Balance
- **Source**: Direct from Braavos wallet
- **Hook**: `useBraavosBalance()`
- **Refresh**: Every 15 seconds
- **Shows**: Your actual STRK in Braavos

#### ChipiPay Vault Balance
- **Source**: Vault contract ledger
- **Hook**: `useVaultBalance({ address })`
- **Refresh**: Every 15 seconds
- **Shows**: Your vault ledger balance

### API Endpoints:
```typescript
// Get vault balance
GET /api/vault/balance?address=0x57d0...6473

Response: {
  balance_low: "100",
  balance_high: "0",
  balance_human: "0.0001 STRK"
}

// Get vault status
GET /api/vault/status

Response: {
  owner: "0x03a5...",
  hot_wallet: "0x4afa...",
  is_frozen: false
}
```

---

## 4. ⚡ QUICK ACTIONS

### Quick Amount Buttons:
The Transaction Panel has preset amounts for convenience:
- **1 STRK**
- **5 STRK**
- **10 STRK**
- **50 STRK**

Just click a button to instantly fill the amount field!

---

## 🎨 UI Components

### Transaction Panel Features:

```
┌─────────────────────────────────────────┐
│          Transactions                   │
├─────────────────────────────────────────┤
│  [Deposit] [Withdraw]  ← Tabs           │
│                                         │
│  Amount (STRK)                          │
│  ┌───────────────────────────────────┐ │
│  │ 10.0000                           │ │
│  └───────────────────────────────────┘ │
│  Available: 100.0000 STRK              │
│                                         │
│  ℹ️ Deposit/Withdraw Flow Info          │
│                                         │
│  [Deposit to Vault] ← Action Button    │
│                                         │
│  ✅ Success/Error Messages              │
│                                         │
│  Quick amounts:                         │
│  [1] [5] [10] [50]                     │
└─────────────────────────────────────────┘
```

### Status Messages:

#### Success (Deposit):
```
✅ Deposit initiated! Transaction hash: 0x123abc...
   Please wait for confirmation, then contact admin
   to credit your vault balance.
```

#### Success (Withdraw):
```
✅ Withdrawal successful! Transaction hash: 0x456def...
```

#### Error:
```
❌ Insufficient vault balance
❌ Failed to deposit. Please try again.
```

---

## 📱 Complete User Flow

### First Time Setup:
1. **Connect Braavos** (top right)
2. **Login with Clerk** (top right)
3. **Dashboard appears** with 2 cards

### Making a Deposit:
1. **Open Transaction Panel** (below wallet cards)
2. **Click "Deposit" tab**
3. **Enter amount** or use quick button
4. **Click "Deposit to Vault"**
5. **Approve in Braavos popup**
6. **Wait for tx confirmation** (~30 seconds)
7. **Message shows tx hash**
8. **Contact admin** or run:
   ```bash
   ./vault-commands.sh set <your_address> <amount>
   ```
9. **Balance updates** automatically

### Making a Withdrawal:
1. **Open Transaction Panel**
2. **Click "Withdraw" tab**
3. **Enter amount** (≤ available balance)
4. **Click "Withdraw to Braavos"**
5. **API processes request** (~5 seconds)
6. **Success message** shows tx hash
7. **Check Braavos wallet** for received STRK
8. **Vault balance updates** automatically

---

## 🔐 Security Features

### Deposit Security:
- ✅ User controls: You execute transfer via Braavos
- ✅ Direct to vault: No intermediaries
- ✅ Requires signature: Must approve in Braavos
- ✅ Admin verification: Admin credits after confirmation

### Withdraw Security:
- ✅ Balance check: Can't withdraw more than you have
- ✅ Hot wallet auth: Only authorized hot wallet can execute
- ✅ Contract validation: Vault checks permissions
- ✅ Event logging: All withdrawals logged on-chain

### API Security:
- ✅ Server-side execution: Withdrawals via API (not client)
- ✅ Private key protection: Never exposed to client
- ✅ Rate limiting: (Can be added)
- ✅ Input validation: Amounts, addresses checked

---

## 🧪 Testing Commands

### Test Deposit Flow:
```bash
# 1. Get some test STRK
# Visit: https://starknet-faucet.vercel.app/
# Enter your Braavos address

# 2. Make a deposit via UI
# Amount: 10 STRK

# 3. Wait for confirmation, then credit vault:
./vault-commands.sh set <your_braavos_address> 10

# 4. Check vault balance:
./vault-commands.sh balance <your_braavos_address>

# Should show: [10, 0] (10 STRK)
```

### Test Withdraw Flow:
```bash
# 1. Ensure you have vault balance
./vault-commands.sh balance <your_braavos_address>

# 2. Make withdrawal via UI
# Amount: 5 STRK

# 3. Check transaction hash in message
# 4. Verify Braavos received tokens
# 5. Check updated vault balance:
./vault-commands.sh balance <your_braavos_address>

# Should show: [5, 0] (5 STRK remaining)
```

---

## 🐛 Troubleshooting

### "Please install Braavos wallet extension"
- **Solution**: Install Braavos from https://braavos.app/
- Refresh page after installation

### "Insufficient vault balance"
- **Solution**: Deposit more STRK first
- Check balance in ChipiPay Vault card

### "Failed to deposit"
- **Check**: Do you have enough STRK for tx + gas?
- **Check**: Did you approve in Braavos popup?
- **Solution**: Try again with lower amount

### "Withdrawal failed"
- **Check**: Is hot wallet authorized?
  ```bash
  ./vault-commands.sh status
  ```
- **Check**: Is vault frozen?
  ```bash
  ./vault-commands.sh status
  # If frozen: ./vault-commands.sh unfreeze
  ```

### Balance not updating
- **Wait**: Auto-refresh every 15 seconds
- **Or**: Manually refresh page (F5)

---

## 📊 Transaction History

### Future Feature (Not Yet Implemented):
We can add transaction history by:

1. **Listening to contract events**:
   - `Deposited(user, amount, timestamp)`
   - `Withdrawn(user, amount, timestamp)`

2. **Storing in database**:
   - Save all transactions
   - Show in UI table

3. **UI Component**:
   ```tsx
   <TransactionHistory address={address} />
   ```

Would you like me to implement this? 🚀

---

## ✅ Feature Checklist

- [x] Deposit STRK to vault (Braavos → Vault)
- [x] Withdraw STRK from vault (Vault → Braavos)
- [x] View Braavos balance (real-time)
- [x] View Vault balance (real-time)
- [x] Auto-refresh balances (15s intervals)
- [x] Transaction status messages
- [x] Quick amount buttons
- [x] Input validation
- [x] Error handling
- [x] Loading states
- [ ] Transaction history (future)
- [ ] Gas estimation (future)
- [ ] Multi-token support (future)

---

## 🎯 Summary

Your Nimbus app now has:
1. ✅ **Full deposit functionality** - Transfer STRK to vault
2. ✅ **Full withdrawal functionality** - Request STRK back
3. ✅ **Real-time balance tracking** - Both Braavos & Vault
4. ✅ **Beautiful UI** - Tabs, status messages, quick actions
5. ✅ **Security** - Proper auth, validation, error handling

Everything is ready to use! Just connect Braavos, login, and start transacting! 💪
