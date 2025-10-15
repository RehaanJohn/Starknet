import { strToUint256Hex, uint256ToDecimalString } from '@/lib/uint256';

describe('uint256 helper', () => {
  it('converts simple amounts', () => {
    const { low, high, amountWei } = strToUint256Hex('1', 18);
    expect(typeof low).toBe('string');
    expect(typeof high).toBe('string');
    expect(typeof amountWei).toBe('string');
    expect(uint256ToDecimalString(low, high, 18)).toBe('1');
  });

  it('handles fractional amounts', () => {
    const { low, high } = strToUint256Hex('0.5', 18);
    expect(uint256ToDecimalString(low, high, 18)).toBe('0.5');
  });

  it('handles large amounts', () => {
    const { low, high } = strToUint256Hex('100000000000000', 18);
    expect(uint256ToDecimalString(low, high, 18)).toBe('100000000000000');
  });
});
