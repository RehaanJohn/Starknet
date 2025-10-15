/**
 * uint256 helpers
 * Provides utilities to convert human amounts (STRK) to Uint256 limbs for Starknet calldata.
 * All amounts passed/returned are in STRK (decimal) unless noted.
 */

export function strToUint256Hex(amountStr: string | number | bigint, decimals = 18) {
  // Convert to BigInt wei-like value using decimals
  let amountBigInt: bigint;
  if (typeof amountStr === 'bigint') {
    amountBigInt = amountStr;
  } else if (typeof amountStr === 'number') {
    // avoid float imprecision by using string conversion
    amountBigInt = parseAmountString(amountStr.toString(), decimals);
  } else {
    amountBigInt = parseAmountString(amountStr, decimals);
  }

  const TWO_128 = BigInt(2) ** BigInt(128);
  const low = amountBigInt % TWO_128;
  const high = amountBigInt / TWO_128;

  return {
    low: '0x' + low.toString(16),
    high: '0x' + high.toString(16),
    amountWei: amountBigInt.toString(),
  };
}

function parseAmountString(amount: string, decimals: number) {
  // amount may be like "1.234", we want to convert to integer with decimals places
  const parts = String(amount).split('.');
  const whole = parts[0] || '0';
  const frac = parts[1] || '';
  if (frac.length > decimals) {
    // truncate (no rounding)
    const truncated = frac.slice(0, decimals);
    const combined = BigInt(whole) * BigInt(10 ** decimals) + BigInt(truncated.padEnd(decimals, '0'));
    return combined;
  }
  const fracPadded = frac.padEnd(decimals, '0');
  const combined = BigInt(whole) * BigInt(10 ** decimals) + BigInt(fracPadded);
  return combined;
}

export function uint256ToDecimalString(lowHex: string, highHex: string, decimals = 18) {
  const low = BigInt(lowHex);
  const high = BigInt(highHex);
  const TWO_128 = BigInt(2) ** BigInt(128);
  const amount = high * TWO_128 + low;
  const base = BigInt(10) ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/,'');
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

export function uint256ToBigInt(lowHex: string, highHex: string) {
  const low = BigInt(lowHex);
  const high = BigInt(highHex);
  const TWO_128 = BigInt(2) ** BigInt(128);
  return high * TWO_128 + low;
}
