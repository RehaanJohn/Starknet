import { NextResponse } from 'next/server';
import { RpcProvider, Contract } from 'starknet';

const VAULT_ABI = [
  {
    name: 'get_hot_wallet',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'core::starknet::contract_address::ContractAddress' }],
    state_mutability: 'view',
  },
];

/**
 * Get Hot Wallet API
 * Equivalent to: starkli call get_hot_wallet
 */
export async function GET() {
  try {
    const provider = new RpcProvider({
      nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://starknet-sepolia.public.blastapi.io',
    });

    const contract = new Contract(
      VAULT_ABI,
      process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS!,
      provider
    );

    const hotWallet = await contract.get_hot_wallet();
    
    return NextResponse.json({
      hot_wallet: hotWallet.toString(),
      contract_address: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS,
    });
  } catch (error: any) {
    console.error('❌ Error getting hot wallet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get hot wallet' },
      { status: 500 }
    );
  }
}