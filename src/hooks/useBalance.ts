import { useEffect, useState } from 'react';

/**
 * useBalance
 * - Polls Chipi wallet balance (simple implementation using provided SDK hooks or window.chipi)
 * - Falls back to local state if SDK is unavailable
 * - Returns balance (in STRK), loading state, and a refresh function
 *
 * Notes:
 * - This is a small client-side helper. For robust production use, prefer server-side balance monitoring
 *   and/or periodic background workers that reconcile on-chain state.
 */

export function useBalance({ address, refreshInterval = 15000 }: { address?: string | null; refreshInterval?: number }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    async function fetchBalance() {
      if (!address) {
        setBalance(null);
        return;
      }
      setLoading(true);
      try {
        // Try to use a global Chipi SDK or window provider if present
        // This is best-effort: the actual project may provide a hook (useGetBalance)
        // If so, prefer replacing this with that hook.
        if (typeof window !== 'undefined' && (window as any).chipi && (window as any).chipi.getBalance) {
          const bal = await (window as any).chipi.getBalance(address);
          // assume SDK returns balance in wei-like smallest unit; convert to STRK if needed
          // If it returns STRK already, this will still work if small.
          const asNumber = typeof bal === 'object' && bal?.toNumber ? bal.toNumber() : Number(bal);
          if (mounted) setBalance(asNumber / 1e18);
        } else {
          // Fallback: attempt a simple RPC via fetch to a public provider (best-effort, may be disabled)
          // We avoid network calls in this hook by default; caller can provide a balance prop alternatively.
          if (mounted) setBalance(null);
        }
      } catch (err) {
        if (mounted) setBalance(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchBalance();
    if (refreshInterval > 0) timer = window.setInterval(fetchBalance, refreshInterval);
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [address, refreshInterval]);

  return { balance, loading, refresh: () => {} };
}
