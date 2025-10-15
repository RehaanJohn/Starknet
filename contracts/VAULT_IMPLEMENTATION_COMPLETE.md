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