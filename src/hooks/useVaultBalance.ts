import { useEffect, useState } from 'react';

const VAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS || '0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://cloud.argent-api.com/v1/starknet/sepolia/rpc/v0.9';

/**
 * useVaultBalance
 * - Fetches ChipiPay wallet balance from the vault contract
 * - Returns balance in STRK (converted from u128 low/high parts)
 */
export function useVaultBalance({ 
  address, 
  pollInterval = 15000 
}: { 
  address?: string | null; 
  pollInterval?: number 
}) {
  const [balanceLow, setBalanceLow] = useState<bigint | null>(null);
  const [balanceHigh, setBalanceHigh] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    async function refresh() {
      if (!address) {
        if (mounted) {
          setBalanceLow(null);
          setBalanceHigh(null);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Use the API route instead of direct contract call
        const response = await fetch(`/api/vault/balance?address=${address}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch balance');
        }
        
        if (mounted) {
          setBalanceLow(BigInt(data.balance_low || '0'));
          setBalanceHigh(BigInt(data.balance_high || '0'));
        }
      } catch (err: any) {
        console.error('Error fetching vault balance:', err);
        if (mounted) {
          setBalanceLow(BigInt(0));
          setBalanceHigh(BigInt(0));
          setError(err.message || 'Failed to fetch balance');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refresh();
    if (pollInterval > 0) timer = window.setInterval(refresh, pollInterval);
    
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [address, pollInterval]);

  // Convert u128 low/high to human readable STRK
  const balanceHuman = balanceLow !== null && balanceHigh !== null
    ? Number(balanceLow + (balanceHigh << BigInt(128))) / 1e18
    : null;

  return { 
    balanceLow, 
    balanceHigh, 
    balanceHuman, 
    loading, 
    error 
  };
}
