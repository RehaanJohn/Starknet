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
  {
    name: 'get_chipi_balance',
    type: 'function',
    inputs: [{ name: 'user', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: '(core::integer::u128, core::integer::u128)' }],
    state_mutability: 'view',
  },
];

/**
 * Process Deposit API
 * Called after user deposits STRK to vault contract
 * Automatically credits their vault balance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, amount, transactionHash } = body;

    if (!userAddress || !amount) {
      return NextResponse.json(
        { error: 'User address and amount required' },
        { status: 400 }
      );
    }

    console.log(`📥 Processing deposit for ${userAddress}: ${amount} STRK`);

    // Initialize provider and owner account
    const provider = new RpcProvider({
      nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://starknet-sepolia.public.blastapi.io',
    });
    // Validate environment variables before constructing Account
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

    // Get current balance
    const currentBalance = await contract.get_chipi_balance(userAddress);
    const currentLow = BigInt(currentBalance[0].toString());
    const currentHigh = BigInt(currentBalance[1].toString());

    // Calculate new balance (current + deposit)
    const depositAmount = BigInt(Math.floor(parseFloat(amount) * 1e18));
    const newTotal = (currentHigh << BigInt(128)) + currentLow + depositAmount;
    
    // Split into low/high
    const newLow = newTotal & ((BigInt(1) << BigInt(128)) - BigInt(1));
    const newHigh = newTotal >> BigInt(128);

    console.log(`💰 Current: ${currentLow.toString()}, New: ${newLow.toString()}`);

    // Set new balance
    const result = await contract.set_chipi_balance(
      userAddress,
      newLow.toString(),
      newHigh.toString()
    );

    console.log(`✅ Balance updated! TX: ${result.transaction_hash}`);

    return NextResponse.json({
      success: true,
      transaction_hash: result.transaction_hash,
      old_balance: currentLow.toString(),
      new_balance: newLow.toString(),
      deposited: depositAmount.toString(),
    });

  } catch (error: any) {
    console.error('❌ Error processing deposit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process deposit' },
      { status: 500 }
    );
  }
}
