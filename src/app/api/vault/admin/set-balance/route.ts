import { NextRequest, NextResponse } from 'next/server';
import { Account, RpcProvider, Contract } from 'starknet';

const VAULT_ABI = [
  {
    name: 'set_chipi_balance',
    type: 'function',
    inputs: [
      { name: 'user', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount_low', type: 'core::integer::u128' },
      { name: 'amount_high', type: 'core::integer::u128' }
    ],
    outputs: [],
    state_mutability: 'external',
  },
];

/**
 * Admin Set Balance API
 * Equivalent to: starkli invoke set_chipi_balance <user> <amount_low> <amount_high>
 * Only the owner can call this
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, amountLow, amountHigh } = body;

    if (!userAddress || amountLow === undefined || amountHigh === undefined) {
      return NextResponse.json(
        { error: 'User address, amount_low, and amount_high required' },
        { status: 400 }
      );
    }

    console.log(`🔧 Admin setting balance for ${userAddress}: ${amountLow} (low), ${amountHigh} (high)`);

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

    // Call set_chipi_balance
    const result = await contract.set_chipi_balance(
      userAddress,
      amountLow.toString(),
      amountHigh.toString()
    );

    console.log(`✅ Balance set! TX: ${result.transaction_hash}`);

    return NextResponse.json({
      success: true,
      transaction_hash: result.transaction_hash,
      user_address: userAddress,
      amount_low: amountLow.toString(),
      amount_high: amountHigh.toString(),
    });

  } catch (error: any) {
    console.error('❌ Error setting balance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set balance' },
      { status: 500 }
    );
  }
}