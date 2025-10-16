import { NextRequest, NextResponse } from 'next/server';
import { Provider, Contract, Account } from 'starknet';
import vaultAbi from '@/abis/vault.json'; // Ensure the ABI is correct and matches the contract

const RPC_URL = 'https://starknet-sepolia.public.blastapi.io';

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
        { error: "Missing 'hotWalletAddress' in request body" },
        { status: 400 }
      );
    }

    const provider = new Provider({ baseUrl: RPC_URL });

    // Initialize the owner account (admin account)
    const ownerAccount = new Account(
      provider,
      process.env.NEXT_PUBLIC_OWNER_ACCOUNT_ADDRESS!,
      process.env.OWNER_ACCOUNT_PRIVATE_KEY!
    );

    // Initialize the contract with the owner account
    const contract = new Contract(
      vaultAbi,
      process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS!,
      ownerAccount
    );

    // Call the `authorize_hot` method
    const result = await contract.invoke('authorize_hot', [hotWalletAddress]);

    return NextResponse.json({
      message: 'Hot wallet authorized successfully',
      transaction_hash: result.transaction_hash,
    });
  } catch (error: any) {
    console.error('Error authorizing hot wallet:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}