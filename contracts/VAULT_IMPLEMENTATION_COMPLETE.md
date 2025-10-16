# 🚀 Vault Contract - Next.js Integration Commands

## 📦 Install Dependencies

```bash
npm install starknet@next
# or
yarn add starknet@next
```

## 🔧 Setup Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS=0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07
NEXT_PUBLIC_RPC_URL=https://starknet-sepolia.public.blastapi.io
NEXT_PUBLIC_CHIPI_HOT_WALLET=0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926
```

## 📝 Quick Test Commands (API Routes)

### 1. Create API Route to Read Balance

Create `app/api/vault/balance/route.ts`:

```bash
# Copy this to your Next.js project
cat > app/api/vault/balance/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { Contract, RpcProvider } from 'starknet';

const VAULT_ABI = [
  {
    name: 'get_chipi_balance',
    type: 'function',
    inputs: [{ name: 'user', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: '(core::integer::u128, core::integer::u128)' }],
    state_mutability: 'view',
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userAddress = searchParams.get('address');

  if (!userAddress) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const provider = new RpcProvider({
    nodeUrl: process.env.NEXT_PUBLIC_RPC_URL!,
  });

  const contract = new Contract(
    VAULT_ABI,
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS!,
    provider
  );

  const balance = await contract.get_chipi_balance(userAddress);
  
  return NextResponse.json({
    address: userAddress,
    balance_low: balance[0].toString(),
    balance_high: balance[1].toString(),
  });
}
EOF
```

### 2. Create API Route to Check Vault Status

Create `app/api/vault/status/route.ts`:

```bash
cat > app/api/vault/status/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { Contract, RpcProvider } from 'starknet';

const VAULT_ABI = [
  {
    name: 'get_owner',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'core::starknet::contract_address::ContractAddress' }],
    state_mutability: 'view',
  },
  {
    name: 'get_hot_wallet',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'core::starknet::contract_address::ContractAddress' }],
    state_mutability: 'view',
  },
  {
    name: 'is_frozen',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'view',
  },
];

export async function GET() {
  const provider = new RpcProvider({
    nodeUrl: process.env.NEXT_PUBLIC_RPC_URL!,
  });

  const contract = new Contract(
    VAULT_ABI,
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS!,
    provider
  );

  const [owner, hotWallet, isFrozen] = await Promise.all([
    contract.get_owner(),
    contract.get_hot_wallet(),
    contract.is_frozen(),
  ]);

  return NextResponse.json({
    contract_address: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS,
    owner: owner.toString(),
    hot_wallet: hotWallet.toString(),
    is_frozen: isFrozen,
  });
}
EOF
```

## 🧪 Test Your API Routes

```bash
# Start your Next.js dev server
npm run dev

# In another terminal, test the APIs:

# 1. Check vault status
curl http://localhost:3000/api/vault/status

# 2. Check ChipiPay wallet balance
curl "http://localhost:3000/api/vault/balance?address=0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926"

# 3. Check your deployer balance
curl "http://localhost:3000/api/vault/balance?address=0x03a50aF4b813776EE8BFA7caF1f8D8bb4738b7a43981083Dd64D4aACBe9230F8"
```

## 🎨 Frontend Component Commands

Create a simple test page `app/vault/page.tsx`:

```bash
cat > app/vault/page.tsx << 'EOF'
'use client';

import { useEffect, useState } from 'react';

export default function VaultPage() {
  const [status, setStatus] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);

  useEffect(() => {
    // Fetch vault status
    fetch('/api/vault/status')
      .then(res => res.json())
      .then(setStatus);

    // Fetch ChipiPay balance
    fetch('/api/vault/balance?address=0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926')
      .then(res => res.json())
      .then(setBalance);
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Vault Contract Status</h1>
      
      {status && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-bold text-xl mb-2">Contract Info</h2>
          <p><strong>Address:</strong> {status.contract_address}</p>
          <p><strong>Owner:</strong> {status.owner}</p>
          <p><strong>Hot Wallet:</strong> {status.hot_wallet}</p>
          <p><strong>Frozen:</strong> {status.is_frozen ? 'Yes' : 'No'}</p>
        </div>
      )}

      {balance && (
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-bold text-xl mb-2">ChipiPay Balance</h2>
          <p><strong>Low:</strong> {balance.balance_low}</p>
          <p><strong>High:</strong> {balance.balance_high}</p>
        </div>
      )}
    </div>
  );
}
EOF
```

## 🌐 Access Your Vault Page

```bash
# Open in browser
open http://localhost:3000/vault
```

## 🔗 Useful Links

- **Contract on Voyager:** https://sepolia.voyager.online/contract/0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07
- **Contract on Starkscan:** https://sepolia.starkscan.co/contract/0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07

## ✅ You're Done!

Your vault contract is now integrated with your Next.js app. You can now:
- ✅ Read vault balances via API
- ✅ Check vault status
- ✅ Display contract info in your UI

# Starknet Vault Contract Documentation

## Contract Address

**Deployed Address:** `0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07`

---

## 🏗️ Contract Structure

### **Storage (The Database)**

```cairo
#[storage]
struct Storage {
    owner: ContractAddress,              // Who deployed the contract (YOU)
    hot_wallet: ContractAddress,          // Authorized wallet for withdrawals (ChipiPay)
    chipi_balance_low: LegacyMap<ContractAddress, u128>,   // User balances (lower 128 bits)
    chipi_balance_high: LegacyMap<ContractAddress, u128>,  // User balances (upper 128 bits)
    frozen: bool,                         // Emergency pause switch
}
```

**Why split balances into low/high?**
- Cairo uses u128 max, but we want to track larger numbers (u256)
- So we split: `total_balance = (high << 128) + low`
- Example: Balance of 1000 = `low: 1000, high: 0`

---

## 🔧 Functions Explained

### **1. Constructor** (Runs once when deployed)

```cairo
fn constructor(ref self: ContractState, owner: ContractAddress) {
    self.owner.write(owner);      // Set YOU as owner
    self.frozen.write(false);     // Start unfrozen
}
```

**What happened:** When you deployed, it saved your address as owner.

---

### **2. authorize_hot** (You authorize ChipiPay)

```cairo
fn authorize_hot(ref self: ContractState, hot: ContractAddress) {
    let caller = get_caller_address();
    let contract_owner = self.owner.read();
    assert(caller == contract_owner, 'Only owner can authorize');  // Only YOU can call this
    
    self.hot_wallet.write(hot);                    // Save ChipiPay wallet address
    self.emit(HotWalletAuthorized { hot_wallet: hot });  // Emit event
}
```

**What it does:**
- ✅ Checks: Are you the owner? If not, REJECT
- ✅ Saves ChipiPay wallet as authorized
- ✅ Emits event so you can track it

**Use case:** You run this ONCE to give ChipiPay permission to withdraw

---

### **3. set_chipi_balance** (You credit user accounts)

```cairo
fn set_chipi_balance(
    ref self: ContractState, 
    user: ContractAddress, 
    amount_low: u128, 
    amount_high: u128
) {
    let caller = get_caller_address();
    let contract_owner = self.owner.read();
    assert(caller == contract_owner, 'Only owner can set balance');  // Only YOU
    
    self.chipi_balance_low.write(user, amount_low);    // Save balance
    self.chipi_balance_high.write(user, amount_high);
    self.emit(BalanceUpdated { ... });                 // Emit event
}
```

**What it does:**
- ✅ Only YOU (owner) can set balances
- ✅ Updates the internal ledger for a user
- ✅ Emits event

**Real scenario:**
```
User deposits 500 STRK to your backend
↓
You verify deposit
↓
You call: set_chipi_balance(user_address, 500, 0)
↓
User now has "500" credits in vault
```

---

### **4. withdraw_by_hot** (ChipiPay processes withdrawals)

```cairo
fn withdraw_by_hot(
    ref self: ContractState, 
    to: ContractAddress,      // Where to send
    amount_low: u128,         // How much (low)
    amount_high: u128         // How much (high)
) {
    let caller = get_caller_address();
    let authorized_hot = self.hot_wallet.read();
    
    // CHECK 1: Is caller the authorized hot wallet?
    assert(caller == authorized_hot, 'Only hot wallet can withdraw');

    // CHECK 2: Is vault frozen?
    let is_frozen = self.frozen.read();
    assert(!is_frozen, 'Vault is frozen');

    // CHECK 3: Does caller have enough balance?
    let current_low = self.chipi_balance_low.read(caller);
    let current_high = self.chipi_balance_high.read(caller);
    assert(current_high >= amount_high, 'Insufficient balance (high)');
    if current_high == amount_high {
        assert(current_low >= amount_low, 'Insufficient balance (low)');
    }

    // SUBTRACT THE BALANCE (with borrow handling)
    let (new_low, borrow) = if current_low >= amount_low {
        (current_low - amount_low, 0_u128)
    } else {
        // Need to borrow from high part
        (0x100000000000000000000000000000000_u128 + current_low - amount_low, 1_u128)
    };
    let new_high = current_high - amount_high - borrow;

    // SAVE NEW BALANCE
    self.chipi_balance_low.write(caller, new_low);
    self.chipi_balance_high.write(caller, new_high);

    // EMIT EVENT
    self.emit(WithdrawalExecuted { from: caller, to: to, amount_low, amount_high });
}
```

**What it does - Step by Step:**

1. **Security Checks:**
   - ✅ Is caller the authorized ChipiPay hot wallet? 
   - ✅ Is vault NOT frozen?
   - ✅ Does hot wallet have enough balance?

2. **Math (Balance Subtraction):**
   - If `current_low >= amount_low`: Simple subtraction
   - If `current_low < amount_low`: Borrow from high part (like borrowing in subtraction)
   
3. **Update Balance:**
   - Saves new balance to storage

4. **Emit Event:**
   - Your backend listens to this event
   - Then sends actual STRK tokens to the user

**Real scenario:**
```
User requests 100 STRK withdrawal
↓
ChipiPay hot wallet calls: withdraw_by_hot(user_address, 100, 0)
↓
Vault checks: Hot wallet authorized? ✓
Vault checks: Balance >= 100? ✓
Vault updates: balance -= 100
↓
Event emitted
↓
Your backend sees event → sends real STRK to user
```

---

### **5. freeze / unfreeze** (Emergency Stop)

```cairo
fn freeze(ref self: ContractState) {
    let caller = get_caller_address();
    let contract_owner = self.owner.read();
    assert(caller == contract_owner, 'Only owner can freeze');
    
    self.frozen.write(true);
    self.emit(VaultFrozen { by: caller });
}
```

**What it does:**
- ✅ Only YOU can freeze
- ✅ Sets `frozen = true`
- ✅ ALL withdrawals stop working
- ✅ Useful if you detect hack/exploit

---

### **6. revoke** (Remove hot wallet authorization)

```cairo
fn revoke(ref self: ContractState) {
    let caller = get_caller_address();
    let contract_owner = self.owner.read();
    assert(caller == contract_owner, 'Only owner can revoke');
    
    let hot = self.hot_wallet.read();
    self.hot_wallet.write(starknet::contract_address_const::<0>());  // Set to 0x0
    self.emit(HotWalletRevoked { hot_wallet: hot });
}
```

**What it does:**
- ✅ Removes ChipiPay's authorization
- ✅ Sets hot_wallet to 0x0 (null)
- ✅ Hot wallet can NO LONGER withdraw

---

### **7. Read Functions** (Anyone can call)

```cairo
fn get_chipi_balance(self: @ContractState, user: ContractAddress) -> (u128, u128)
fn get_owner(self: @ContractState) -> ContractAddress
fn get_hot_wallet(self: @ContractState) -> ContractAddress
fn is_frozen(self: @ContractState) -> bool
```

These just READ data, no modifications. Free to call!

---

## 🎯 Complete Flow Example

### **Scenario: User Deposits & Withdraws**

```
1️⃣ USER DEPOSITS 1000 STRK
   User → Sends 1000 STRK to your backend wallet
   You  → Call set_chipi_balance(user, 1000, 0)
   Vault → user.balance = 1000

2️⃣ USER REQUESTS 300 STRK WITHDRAWAL
   App  → User clicks "Withdraw 300 STRK"
   Hot  → Calls withdraw_by_hot(user, 300, 0)
   Vault → Checks authorization ✓
   Vault → Checks balance (1000 >= 300) ✓
   Vault → Updates balance: 1000 - 300 = 700
   Vault → Emits WithdrawalExecuted event
   You  → Listen to event → Send 300 real STRK to user

3️⃣ USER BALANCE NOW
   Vault ledger: 700
   User received: 300 STRK (real tokens)
```

---

## 🔒 Security Features

| Feature | Purpose | Who Can Use |
|---------|---------|-------------|
| **Owner-only functions** | Prevent unauthorized control | Only YOU |
| **Hot wallet check** | Only authorized wallet withdraws | Only ChipiPay |
| **Balance checking** | Prevent overdrafts | Automatic |
| **Freeze mechanism** | Emergency stop | Only YOU |
| **Event emissions** | Audit trail | Everyone can see |

---

## 💡 Key Insight

**This contract is NOT a wallet holding tokens!**

It's a **permission system + ledger** that:
- Tracks who has what balance
- Controls who can modify balances  
- Emits events your backend uses to trigger real token transfers

Think of it like a **bank's internal database** - the database tracks your balance, but the actual money is elsewhere!