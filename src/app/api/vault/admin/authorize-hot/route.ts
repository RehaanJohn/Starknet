import { NextRequest, NextResponse } from 'next/server';
import { Account, RpcProvider, Contract } from 'starknet';

const VAULT_ABI = [
  {
    name: 'authorize_hot',
    type: 'function',
    inputs: [
      { name: 'hot', type: 'core::starknet::contract_address::ContractAddress' }
    ],
    outputs: [],
    state_mutability: 'external',
  },
];

/**
 * Admin Authorize Hot Wallet API
 * Equivalent to: starkli invoke authorize_hot <hot_wallet_address>
 * Only the owner can call this
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotWalletAddress } = body;

    if (!hotWalletAddress) {
      return NextResponse.json(
        { error: 'Hot wallet address required' },
        { status: 400 }
      );
    }

    console.log(`🔥 Admin authorizing hot wallet: ${hotWalletAddress}`);

    // Initialize provider and owner account
    const provider = new RpcProvider({
      nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://starknet-sepolia.public.blastapi.io',
    });

    // Validate environment variables
    const ownerAddress = process.env.STARKNET_ACCOUNT_ADDRESS;
    const ownerPrivateKey = process.env.STARKNET_PRIVATE_KEY;

    if (!ownerAddress || !ownerPrivateKey) {
      console.error('Missing STARKNET_ACCOUNT_ADDRESS or STARKNET_PRIVATE_KEY in environment');
      return NextResponse.json({ error: 'Server misconfiguration: owner account not set' }, { status: 500 });
    }

    let ownerAccount: any;
    try {
      ownerAccount = new Account(
        provider,
        ownerAddress,
        ownerPrivateKey,
        '1' // Cairo version
      );
    } catch (acctErr: any) {
      console.error('Failed to create owner Account:', acctErr);
      return NextResponse.json({ error: 'Failed to initialize owner account' }, { status: 500 });
    }

    const contract = new Contract(
      VAULT_ABI,
      process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS!,
      ownerAccount
    );

    // Call authorize_hot
    const result = await contract.authorize_hot(hotWalletAddress);

    console.log(`✅ Hot wallet authorized! TX: ${result.transaction_hash}`);

    return NextResponse.json({
      success: true,
      transaction_hash: result.transaction_hash,
      hot_wallet_address: hotWalletAddress,
      message: 'Hot wallet authorized successfully',
    });

  } catch (error: any) {
    console.error('❌ Error authorizing hot wallet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to authorize hot wallet' },
      { status: 500 }
    );
  }
}