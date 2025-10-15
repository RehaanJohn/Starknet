# 🔐 Chipi Wallet Security Architecture

## Overview

This implementation creates a **layered security approach** for managing cryptocurrency funds, using Braavos as the primary (cold) wallet and Chipi as a limited, gasless spending wallet.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔒 LAYER 1: BRAAVOS WALLET (Cold Storage / Main Funds)         │
│  ├─ Holds 90%+ of user funds (e.g., 150 STRK)                  │
│  ├─ Requires hardware wallet or extension signature            │
│  ├─ Manual approval for every transaction                      │
│  └─ Minimal attack surface                                     │
│                                                                  │
│  💳 LAYER 2: CHIPI WALLET (Hot Wallet / Spending Limit)         │
│  ├─ Holds max 10 STRK (configurable)                           │
│  ├─ Used for frequent, small gasless transactions              │
│  ├─ Limited damage if compromised                              │
│  └─ Funds replenished from Braavos as needed                   │
│                                                                  │
│  🛡️ LAYER 3: TRANSACTION SECURITY CONTROLS                       │
│  ├─ Per-transaction limit: 2 STRK max                          │
│  ├─ Daily spending limit: 5 STRK max                           │
│  ├─ Rate limiting: 3 transactions per hour max                 │
│  ├─ Confirmation required for amounts > 1 STRK                 │
│  └─ Session timeout: 15 minutes of inactivity                  │
│                                                                  │
│  📊 LAYER 4: MONITORING & EMERGENCY CONTROLS                     │
│  ├─ Real-time transaction logging                              │
│  ├─ Spending analytics dashboard                               │
│  ├─ Emergency freeze button (instant disable)                  │
│  └─ Transaction history & audit trail                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Security Features

### 1. **Spending Limits**
- **Per-Transaction Limit**: Max 2 STRK per single transaction
- **Daily Limit**: Max 5 STRK total per day
- **Wallet Maximum**: Max 10 STRK balance in Chipi wallet
- **Configurable**: All limits can be adjusted in `security-config.ts`

### 2. **Rate Limiting**
- **Hourly Cap**: Maximum 3 transactions per hour
- **Purpose**: Prevents rapid fund drainage in case of compromise
- **Tracking**: Stored in localStorage, persists across page reloads

### 3. **Transaction Confirmation**
- **Threshold**: Transactions ≥ 1 STRK require explicit confirmation
- **Modal UI**: Shows amount, recipient, and security warnings
- **Cannot be bypassed**: User must click "Confirm & Send"

### 4. **Session Management**
- **Timeout**: 15-minute inactivity timeout
- **Auto-logout**: Prevents unauthorized access if user walks away
- **Activity tracking**: Updates on every user interaction

### 5. **Emergency Freeze**
- **Instant**: One-click wallet freeze
- **Complete lockdown**: Disables all transactions immediately
- **User-controlled**: Only wallet owner can freeze/unfreeze

### 6. **Encryption Key Handling**
- **Never stored**: Encryption key is never saved to localStorage or cookies
- **Session-only**: Key exists only in component state during active session
- **Re-entry required**: User must re-enter key after session timeout

---

## 📁 File Structure

```
src/
├── lib/
│   └── security-config.ts          # Security limits and validation logic
├── hooks/
│   └── useWalletSecurity.ts        # React hook for security state management
├── components/
│   ├── ChipiPayment.tsx            # Enhanced payment component with security
│   ├── TransactionConfirmation.tsx # Confirmation modal for large transactions
│   ├── SecurityDashboard.tsx       # Security status and monitoring UI
│   └── BraavosToChipiTransfer.tsx  # Safe fund transfer from Braavos to Chipi
```

---

## 🚀 Usage Guide

### 1. **Initial Setup**

```typescript
// In your component
import { useWalletSecurity } from '@/hooks/useWalletSecurity';

const {
  validateTransactionSecurity,
  recordTransaction,
  freezeWallet,
  unfreezeWallet,
  limits,
} = useWalletSecurity();
```

### 2. **Validate Before Sending**

```typescript
const validation = validateTransactionSecurity(amountInSTRK);

if (!validation.valid) {
  alert(validation.reason); // Show error to user
  return;
}

if (validation.requiresConfirmation) {
  // Show confirmation modal
  showConfirmationModal();
} else {
  // Proceed directly
  sendTransaction();
}
```

### 3. **Record Transactions**

```typescript
// Before sending
const txId = recordTransaction(amount, recipientAddress);

// After success
updateTransactionStatus(txId, 'success', txHash);

// After failure
updateTransactionStatus(txId, 'failed');
```

### 4. **Emergency Freeze**

```typescript
// Freeze wallet immediately
freezeWallet();

// User cannot send any transactions until unfrozen
if (isFrozen) {
  return 'Wallet is frozen';
}

// Unfreeze when safe
unfreezeWallet();
```

---

## ⚙️ Configuration

Edit `src/lib/security-config.ts` to customize limits:

```typescript
export const DEFAULT_SECURITY_LIMITS: SecurityLimits = {
  maxWalletBalance: 10,        // Max STRK in Chipi wallet
  maxTransactionAmount: 2,     // Max STRK per transaction
  dailySpendingLimit: 5,       // Max STRK per day
  maxTransactionsPerHour: 3,   // Max transactions per hour
  confirmationThreshold: 1,    // Require confirmation above this amount
  sessionTimeout: 15,          // Minutes before session expires
};
```

---

## 🔍 Security Best Practices

### ✅ **DO:**
- Keep only small amounts in Chipi wallet (≤ 10 STRK recommended)
- Transfer funds from Braavos in small batches
- Use the emergency freeze if you suspect any suspicious activity
- Regularly check transaction history
- Enable browser security features (e.g., password manager)

### ❌ **DON'T:**
- Store encryption keys in plain text or localStorage
- Transfer large amounts to Chipi wallet at once
- Ignore daily spending limit warnings
- Share your encryption key
- Disable security limits

---

## 🛠️ Advanced Features

### Custom Security Hooks

Create environment-specific limits:

```typescript
// For development
const devLimits: SecurityLimits = {
  ...DEFAULT_SECURITY_LIMITS,
  maxTransactionAmount: 0.1,    // Lower for testing
  sessionTimeout: 5,            // Shorter for testing
};

const security = useWalletSecurity(devLimits);
```

### Audit Logging

All transactions are logged with:
- Unique transaction ID
- Timestamp
- Amount
- Recipient address
- Status (pending/success/failed)
- Transaction hash (if available)

Access via:
```typescript
const { transactionHistory } = useWalletSecurity();
```

---

## 🔐 Attack Mitigation

| Attack Vector | Mitigation Strategy |
|--------------|---------------------|
| **Phishing** | Confirmation modals + address verification |
| **XSS** | Never store encryption key; session-only storage |
| **Rapid Drainage** | Rate limiting (3 tx/hour) + daily limits |
| **Large Theft** | Per-transaction limit (2 STRK max) |
| **Session Hijacking** | 15-minute timeout + activity tracking |
| **Compromised Key** | Limited wallet balance (10 STRK max) |
| **Malicious Extension** | Braavos signature required for funding |

---

## 📊 Monitoring & Alerts

### Real-time Dashboard
- Current daily spending
- Remaining daily limit
- Recent transactions (last hour)
- Security status indicators

### Visual Feedback
- ✅ Green: Safe levels
- ⚠️ Yellow: Approaching limits (>50% daily spend)
- 🔴 Red: Critical (>80% daily spend or frozen)

---

## 🧪 Testing

### Test Scenarios

1. **Normal Flow**
   - Transfer 5 STRK from Braavos to Chipi
   - Send 0.5 STRK transaction (no confirmation needed)
   - Send 1.5 STRK transaction (confirmation required)
   - Verify daily spending tracking

2. **Security Limits**
   - Try sending 3 STRK (should fail: exceeds per-tx limit)
   - Send 3x 1.5 STRK in one hour (4th should fail: rate limit)
   - Send 5 STRK total in a day, try 6th (should fail: daily limit)

3. **Emergency Response**
   - Click "Emergency Freeze"
   - Try sending transaction (should fail: wallet frozen)
   - Unfreeze and retry (should succeed)

4. **Session Timeout**
   - Wait 15 minutes without activity
   - Try sending (should fail: session expired)

---

## 🔄 Future Enhancements

Potential improvements to consider:

1. **Multi-Factor Authentication**: Require email/SMS confirmation for large transactions
2. **Biometric Authentication**: Fingerprint/Face ID for transaction approval
3. **IP Whitelisting**: Only allow transactions from known IP addresses
4. **Smart Contract Integration**: On-chain spending limits enforcement
5. **Anomaly Detection**: ML-based detection of unusual spending patterns
6. **Social Recovery**: Multi-sig or guardian-based account recovery
7. **Hardware Security Module (HSM)**: For enterprise-grade key storage

---

## 📝 Summary

This security architecture implements a **defense-in-depth** strategy:

1. **Compartmentalization**: Separate hot (Chipi) and cold (Braavos) wallets
2. **Least Privilege**: Minimize funds in the hot wallet
3. **Rate Limiting**: Prevent rapid fund drainage
4. **User Confirmation**: Explicit approval for significant transactions
5. **Monitoring**: Real-time visibility into spending patterns
6. **Emergency Controls**: Instant response capability

**Result**: Even if Chipi wallet is compromised, attacker can only access ≤10 STRK and is rate-limited to small, slow extractions that are highly visible to the user.

---

## 🤝 Contributing

To propose security enhancements:
1. Review current implementation
2. Identify potential vulnerabilities
3. Submit detailed proposals with threat models
4. Include test cases for new security features

---

## 📄 License

This security implementation is part of the Fiflow project.

---

**Remember**: Security is a journey, not a destination. Regularly review and update these measures as threats evolve.
