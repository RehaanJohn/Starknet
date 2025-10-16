import { NextResponse } from 'next/server';
import { RpcProvider, Contract } from 'starknet';
import vaultAbi from '@/abis/vault.json'; // Ensure the ABI is correct and matches the contract

const RPC_URL = 'https://starknet-sepolia.public.blastapi.io';

/**
 * Get Hot Wallet API
 * Equivalent to: starkli call get_hot_wallet
 */
export async function GET() {
  try {
    const provider = new RpcProvider({ nodeUrl: RPC_URL });

    // Initialize the contract with the provider by passing a single options object
    const contract = new Contract({
      abi: vaultAbi.abi, // Use the "abi" key from the imported JSON
      address: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
      provider,
    });

    // Call the `get_hot_wallet` method
    const hotWallet = await contract.call('get_hot_wallet');

    return NextResponse.json({
      hotWalletAddress: hotWallet[0],
    });
  } catch (error: any) {
    console.error('Error getting hot wallet:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}