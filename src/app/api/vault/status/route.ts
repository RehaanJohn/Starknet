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
  try {
    const provider = new RpcProvider({
      nodeUrl: process.env.STARKNET_RPC_URL || 'https://cloud.argent-api.com/v1/starknet/sepolia/rpc/v0.9',
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
  } catch (error: any) {
    console.error('Error fetching vault status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
