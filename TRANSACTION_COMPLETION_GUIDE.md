# Transaction Completion Guide

## Current Status

Your transfer component is **working correctly** and catching the real issue:

### The Problem
- **u256_sub Overflow error** = Your Braavos wallet doesn't have enough STRK tokens on-chain
- The error occurs because the ERC-20 contract tries to subtract more tokens than you have

### What the logs show
```
Preparing transfer via helper: {amountNum: 2, amountWei: '2000000000000000000', low: '0x1bc16d674ec80000', high: '0x0'}
```
- You're trying to send **2 STRK**
- The uint256 encoding is **correct** (low: 0x1bc16d674ec80000 = 2000000000000000000 wei)
- But your Braavos account at `0x57d0fb86ba9a76d97d00bcd5b61379773070f7451a2ddb4ccb0d04d71586473` doesn't have 2 STRK

### The 401 Error (separate issue)
- The Chipi SDK `useGetWallet` hook calls production API directly
- It doesn't use our proxy route automatically
- This is a configuration issue, not blocking the transfer

---

## Steps to Complete the Transaction

### Option 1: Fund Your Braavos Wallet (Recommended)

#### If on Testnet (Sepolia):
1. Get your Braavos address from the dashboard
2. Visit Starknet Sepolia faucet:
   - https://starknet-faucet.vercel.app/
   - Or https://faucet.goerli.starknet.io/
3. Request STRK tokens (usually get 0.001-0.01 STRK)
4. Wait 1-2 minutes for confirmation
5. Retry the transfer with a smaller amount (0.001 STRK)

#### If on Mainnet:
1. Bridge STRK from Ethereum mainnet or buy on an exchange
2. Send to your Braavos address
3. Wait for confirmation
4. Retry the transfer

### Option 2: Reduce Transfer Amount
If you have some STRK but less than 2:
1. Check your balance in Braavos extension or block explorer
2. Try transferring a smaller amount (e.g., 0.001 STRK)
3. The component now shows exact balance vs needed amount

---

## Verify Balance Before Transfer

Open browser console and look for:
```
=== BALANCE CHECK ===
Braavos address: 0x...
On-chain balance (STRK): 0.0000
Amount to send (STRK): 2.0000
Has enough? false
```

This tells you exactly how much you have and need.

---

## Next Steps After Funding

1. **Reload the page** to refresh wallet state
2. **Try a small transfer first** (0.001 STRK) to test the flow
3. **Check console logs** - you should see:
   - Balance check passing
   - Transaction submitted
   - Transaction hash

### Expected Success Flow
```
=== BALANCE CHECK ===
On-chain balance (STRK): 0.0050
Amount to send (STRK): 0.0010
Has enough? true

Transfer initiated: {transaction_hash: '0x...'}
```

---

## Fix the 401 Error (Optional)

The 401 is from the Chipi SDK not using the proxy. To fix:

### Quick Fix: Override SDK Base URL
Add to your ChipiClientProvider:
```tsx
<ChipiClientProvider 
  apiPublicKey={process.env.NEXT_PUBLIC_CHIPI_API_KEY!}
  environment='production'
  baseUrl="/api"  // Use Next.js API routes
>
```

### Alternative: Manual Fetch
Replace `useGetWallet` with a manual fetch to `/api/chipi-wallets/by-user?externalUserId=${userId}`.

---

## Testing Checklist

- [ ] Braavos wallet has STRK balance > transfer amount
- [ ] Dev server running on port 3001 (or 3000)
- [ ] Browser console shows balance check logs
- [ ] Transfer amount is reasonable (start with 0.001 STRK)
- [ ] Braavos extension pops up for signature
- [ ] Transaction confirms on-chain

---

## Common Issues

### "u256_sub Overflow" persists
- **Cause**: Still insufficient balance
- **Fix**: Double-check balance in block explorer, not just extension UI

### "Braavos wallet not found"
- **Cause**: Extension not unlocked or not installed
- **Fix**: Open Braavos, unlock, refresh page

### "RPC error estimating fee"
- **Cause**: Invalid calldata or network issues
- **Fix**: Check network (mainnet vs testnet match), restart Braavos

---

## Block Explorers

Check your balance:
- **Mainnet**: https://starkscan.co/contract/[YOUR_ADDRESS]
- **Testnet**: https://testnet.starkscan.co/contract/[YOUR_ADDRESS]

Look for the STRK token balance row.

---

## Summary

✅ **Your code is correct**  
✅ **Uint256 encoding is correct**  
✅ **Balance check is working**  

❌ **Wallet needs funding**  

Once you fund the Braavos wallet with STRK tokens, the transfer will complete successfully.
