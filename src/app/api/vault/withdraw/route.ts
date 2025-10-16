import { NextRequest, NextResponse } from 'next/server';
import { Account, Contract, RpcProvider } from 'starknet';

const VAULT_ABI = [
  {
    name: 'withdraw_by_hot',
    type: 'function',
    inputs: [
      { name: 'to', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount_low', type: 'core::integer::u128' },
      { name: 'amount_high', type: 'core::integer::u128' }
    ],
    outputs: [],
    state_mutability: 'external',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, amount } = body;

    if (!to || amount === undefined) {
      return NextResponse.json({ error: 'Recipient address and amount required' }, { status: 400 });
    }

    // Convert amount to u128 low/high parts (assuming amount is in STRK)
    const amountWei = BigInt(Math.floor(amount * 1e18));
    const amountLow = amountWei & ((BigInt(1) << BigInt(128)) - BigInt(1));
    const amountHigh = amountWei >> BigInt(128);

    const provider = new RpcProvider({
      nodeUrl: process.env.STARKNET_RPC_URL || 'https://cloud.argent-api.com/v1/starknet/sepolia/rpc/v0.9',
    });

    // Use the hot wallet account for withdrawals
    const account = new Account(
      provider,
      process.env.STARKNET_ACCOUNT_ADDRESS!,
      process.env.STARKNET_PRIVATE_KEY!,
      '1' // Cairo version
    );

    const contract = new Contract(
      VAULT_ABI,
      process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS!,
      account
    );

    const result = await contract.withdraw_by_hot(to, amountLow.toString(), amountHigh.toString());
    
    return NextResponse.json({
      success: true,
      transaction_hash: result.transaction_hash,
      to,
      amount_low: amountLow.toString(),
      amount_high: amountHigh.toString(),
    });
  } catch (error: any) {
    console.error('Error withdrawing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
