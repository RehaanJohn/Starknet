import { NextRequest, NextResponse } from 'next/server';
import { RpcProvider } from 'starknet';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userAddress = searchParams.get('address');

  if (!userAddress) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    // Use public RPC endpoint (remove /rpc/v0_7 suffix)
    const provider = new RpcProvider({
      nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://starknet-sepolia.public.blastapi.io',
    });

    // Call contract directly using provider
    const result = await provider.callContract({
      contractAddress: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS!,
      entrypoint: 'get_chipi_balance',
      calldata: [userAddress],
    });
    
    const balance_low = result[0] || '0';
    const balance_high = result[1] || '0';
    
    return NextResponse.json({
      address: userAddress,
      balance_low,
      balance_high,
      balance_human: (Number(balance_low) / 1e18).toFixed(4) + ' STRK',
    });
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    // Return zero balance on error instead of failing
    return NextResponse.json({ 
      address: userAddress,
      balance_low: '0',
      balance_high: '0',
      balance_human: '0.0000 STRK',
      error: error.message
    }, { status: 200 });
  }
}
