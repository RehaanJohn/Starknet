import { NextResponse } from 'next/server';
import { Account, Contract, RpcProvider } from 'starknet';

const VAULT_ABI = [
  {
    name: 'freeze',
    type: 'function',
    inputs: [],
    outputs: [],
    state_mutability: 'external',
  },
];

export async function POST() {
  try {
    const provider = new RpcProvider({
      nodeUrl: process.env.STARKNET_RPC_URL || 'https://cloud.argent-api.com/v1/starknet/sepolia/rpc/v0.9',
    });

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

    const result = await contract.freeze();
    
    return NextResponse.json({
      success: true,
      transaction_hash: result.transaction_hash,
    });
  } catch (error: any) {
    console.error('Error freezing vault:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
