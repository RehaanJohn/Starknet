import { useEffect, useState } from 'react';

import { getErc20Balance } from '@/lib/stark';

const DEFAULT_STRK = '0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D';

export function useBraavosBalance({ tokenAddress = DEFAULT_STRK, pollInterval = 15000 } = {}) {
  const [balanceBig, setBalanceBig] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    async function refresh() {
      if (typeof window === 'undefined' || !(window as any).starknet_braavos) {
        if (mounted) setBalanceBig(null);
        return;
      }

      setLoading(true);
      try {
        const provider = (window as any).starknet_braavos.provider;
        const accountObj = (window as any).starknet_braavos.account;
        const address = accountObj?.address || (await (window as any).starknet_braavos.enable())[0];
        const bal = await getErc20Balance(provider, tokenAddress, address);
        if (mounted) setBalanceBig(bal ?? BigInt(0));
      } catch (err) {
        if (mounted) setBalanceBig(null);
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
  }, [tokenAddress, pollInterval]);

  const human = balanceBig != null ? Number(balanceBig) / 1e18 : null;

  return { balanceBig, balanceHuman: human, loading };
}
