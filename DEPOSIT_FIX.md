# Deposit Transaction Fix

## Problem
The original deposit flow was "simulating" deposits instead of properly processing real on-chain transactions:

1. User would initiate a deposit through the UI
2. Braavos wallet would send STRK to vault contract (real transaction)
3. System would immediately call `auto-setup` API which would call `set-balance`
4. The `set-balance` API would **overwrite** vault balance with whatever amount was passed
5. No verification that tokens actually arrived at vault contract

This resulted in a "Deposit simulated — vault updated" scenario where the vault balance was updated without proper verification.

## Solution
The new flow properly waits for on-chain confirmation and processes deposits correctly:

1. User initiates deposit through UI
2. Braavos wallet sends STRK to vault contract (real transaction)
3. **Wait for transaction confirmation** using `waitForTransaction()` or 30-second delay
4. Call `process-deposit` API which:
   - Reads current vault balance from contract
   - **Adds** deposited amount to existing balance (not overwrite)
   - Updates vault balance on-chain
   - Returns transaction hash for audit trail
5. UI shows both transaction hashes (deposit + balance update)
6. Balances refresh automatically

## Key Changes

### TransactionPanel.tsx
- Removed call to `/api/vault/auto-setup`
- Added transaction confirmation waiting:
  ```typescript
  if (braavos.provider?.waitForTransaction) {
    await braavos.provider.waitForTransaction(tx.transaction_hash, {
      retryInterval: 5000,
    });
  } else {
    // Fallback for wallets without waitForTransaction
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  ```
- Changed to call `/api/vault/process-deposit` instead
- Updated user-facing messages to reflect secure deposit flow
- Added better error handling

## Benefits

1. **Real on-chain verification**: System waits for transaction confirmation
2. **Additive balance updates**: Uses process-deposit which adds to existing balance
3. **Audit trail**: Both transaction hashes are logged and shown to user
4. **Better UX**: Clear status messages during each step
5. **Error recovery**: If processing fails, user is informed that tokens are safe

## Future Improvements

Consider adding:
1. Query STRK token contract to verify transfer event
2. Parse transaction receipt to confirm amount and recipient
3. Rate limiting to prevent duplicate deposit processing
4. Database logging of deposit transactions
5. Admin dashboard to view deposit history

## Testing

To test this fix:
1. Connect Braavos wallet
2. Initiate a deposit from the main page
3. Verify you see "Waiting for transaction confirmation..." message
4. Wait for confirmation (30+ seconds)
5. Verify you see "Transaction confirmed! Processing deposit..." message
6. Verify vault balance is updated correctly
7. Check that both transaction hashes are displayed

## Related Files
- `src/components/TransactionPanel.tsx` - Main deposit UI component
- `src/app/api/vault/process-deposit/route.ts` - API endpoint that processes deposits
- `src/app/api/vault/auto-setup/route.ts` - No longer used for deposits (only for initial setup)
