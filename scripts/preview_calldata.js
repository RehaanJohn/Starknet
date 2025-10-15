#!/usr/bin/env node
// Simple preview script to compute calldata low/high limbs for a STRK amount
// Usage: node scripts/preview_calldata.js <amount> <recipient>

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/preview_calldata.js <amount> <recipient>');
  process.exit(1);
}

const [amountStr, recipient] = args;

function parseAmountString(amount, decimals = 18) {
  const parts = String(amount).split('.');
  const whole = parts[0] || '0';
  const frac = parts[1] || '';
  if (frac.length > decimals) {
    const truncated = frac.slice(0, decimals);
    const combined = BigInt(whole) * BigInt(10 ** decimals) + BigInt(truncated.padEnd(decimals, '0'));
    return combined;
  }
  const fracPadded = frac.padEnd(decimals, '0');
  const combined = BigInt(whole) * BigInt(10 ** decimals) + BigInt(fracPadded);
  return combined;
}

const amountWei = parseAmountString(amountStr, 18);
const TWO_128 = BigInt(2) ** BigInt(128);
const low = amountWei % TWO_128;
const high = amountWei / TWO_128;

console.log('Recipient:', recipient);
console.log('Amount (STRK):', amountStr);
console.log('Amount (wei-like integer):', amountWei.toString());
console.log('Uint256 low (hex):', '0x' + low.toString(16));
console.log('Uint256 high (hex):', '0x' + high.toString(16));
console.log('\nCalldata (recipient, low, high):');
console.log("[", recipient, ",", '0x' + low.toString(16), ",", '0x' + high.toString(16), "]");

// Optional: print sample invoke object
console.log('\nSample calldata for transfer entrypoint:');
console.log(JSON.stringify([
  recipient,
  '0x' + low.toString(16),
  '0x' + high.toString(16),
], null, 2));
