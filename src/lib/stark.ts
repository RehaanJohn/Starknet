import { uint256ToBigInt } from './uint256';

export async function getErc20Balance(provider: any, tokenAddress: string, accountAddress: string) {
  if (!provider || !tokenAddress || !accountAddress) return BigInt(0);

  // Some providers expect callContract({ contractAddress, entrypoint, calldata })
  // The result shape may vary: { result: [low, high] } or array
  try {
    // Try several calldata encodings because providers vary in what they accept
    const attempts = [];

    // 1) as-provided (commonly 0x-prefixed hex)
    attempts.push([accountAddress]);

    // 2) without 0x prefix
    attempts.push([accountAddress?.replace(/^0x/i, '')]);

    // 3) decimal string of the hex (BigInt) - some providers accept decimal felt
    try {
      const asBig = BigInt(accountAddress);
      attempts.push([asBig.toString()]);
    } catch (e) {
      // ignore if not hex
    }

    for (const calldata of attempts) {
      try {
        const res = await provider.callContract({
          contractAddress: tokenAddress,
          entrypoint: 'balanceOf',
          calldata,
        });
        const result = (res && (res.result || res)) || res;
        if (result && result.length >= 2) {
          const low = result[0];
          const high = result[1];
          // console.debug for dev visibility
          console.debug('getErc20Balance success with calldata', calldata, { low, high });
          return uint256ToBigInt(low, high);
        }
      } catch (err) {
        // try next encoding
        const e: any = err;
        console.debug('getErc20Balance attempt failed for calldata', calldata, e?.message || e);
      }
    }

    // nothing worked
    return BigInt(0);
  } catch (err) {
    console.error('getErc20Balance error', err);
    return BigInt(0);
  }
}
