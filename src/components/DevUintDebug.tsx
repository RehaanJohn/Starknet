"use client";

import React from 'react';
import { strToUint256Hex } from '@/lib/uint256';

export default function DevUintDebug({ amount }: { amount: string }) {
  if (process.env.NODE_ENV === 'production') return null;
  try {
    const { low, high, amountWei } = strToUint256Hex(amount, 18);
    return (
      <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-3 text-xs text-gray-300">
        <p>Dev Uint256 Debug</p>
        <p>Amount (wei): {amountWei}</p>
        <p>Low: {low}</p>
        <p>High: {high}</p>
      </div>
    );
  } catch (e) {
    return <div className="text-xs text-red-400">Invalid amount</div>;
  }
}
