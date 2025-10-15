/**
 * Braavos to Chipi Transfer Component
 * 
 * Allows users to safely transfer funds from their Braavos wallet
 * to their Chipi wallet with amount validation and warnings
 */

'use client';

import React, { useState } from 'react';
import { ArrowRight, Wallet, CreditCard, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { DEFAULT_SECURITY_LIMITS } from '@/lib/security-config';

interface BraavosToChipiTransferProps {
  braavosAddress: string;
  chipiPublicKey: string;
  onTransferComplete?: () => void;
}

export default function BraavosToChipiTransfer({
  braavosAddress,
  chipiPublicKey,
  onTransferComplete,
}: BraavosToChipiTransferProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const maxSafeAmount = DEFAULT_SECURITY_LIMITS.maxWalletBalance;

  const handleTransfer = async () => {
    setError('');
    setSuccess('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Warning if exceeding recommended amount
    if (amountNum > maxSafeAmount && !showWarning) {
      setShowWarning(true);
      return;
    }

    try {
      setIsLoading(true);

      // Check if Braavos wallet is available
      if (typeof window === 'undefined' || !window.starknet_braavos) {
        throw new Error('Braavos wallet not found');
      }

      // Prepare transaction
      // Use BigInt to build a proper Uint256 (low, high) split (128-bit limbs)
      const amountWei = BigInt(Math.floor(amountNum * 1e18));
  const TWO_128 = BigInt(2) ** BigInt(128);
  const low = amountWei % TWO_128;
  const high = amountWei / TWO_128;

      console.log('Preparing transfer:', {
        amountNum,
        amountWei: amountWei.toString(),
        low: '0x' + low.toString(16),
        high: '0x' + high.toString(16),
      });

      const calls = [{
        contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', // ETH contract on Starknet
        entrypoint: 'transfer',
        calldata: [
          chipiPublicKey, // recipient
          '0x' + low.toString(16), // low limb
          '0x' + high.toString(16), // high limb
        ],
      }];

      // Execute transaction through Braavos
      const tx = await window.starknet_braavos.account.execute(calls);
      
      console.log('Transfer initiated:', tx);
      setSuccess(`Successfully transferred ${amount} STRK to Chipi wallet!`);
      setAmount('');
      setShowWarning(false);

      if (onTransferComplete) {
        onTransferComplete();
      }

    } catch (err: any) {
      console.error('Transfer error:', err);
      setError(err.message || 'Failed to transfer funds');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowWarning(false);
  };

  return (
    <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRight className="w-5 h-5 text-purple-400" />
        <h3 className="text-xl font-bold text-purple-400">Fund Chipi Wallet</h3>
      </div>

      <p className="text-sm text-gray-400">
        Transfer STRK from your Braavos wallet to your Chipi wallet for gasless transactions.
      </p>

      {/* Security Recommendation */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-200">
            <p className="font-semibold mb-1">Security Best Practice</p>
            <p className="text-xs text-emerald-300/80">
              Keep only small amounts in your Chipi wallet (recommended: ≤ {maxSafeAmount} STRK). 
              This limits exposure if the wallet is compromised.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Transfer Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-orange-400" />
              <p className="text-xs text-gray-400">From: Braavos</p>
            </div>
            <p className="text-sm text-orange-400 font-mono break-all">
              {braavosAddress.slice(0, 8)}...{braavosAddress.slice(-6)}
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-gray-400">To: Chipi</p>
            </div>
            <p className="text-sm text-purple-400 font-mono break-all">
              {chipiPublicKey.slice(0, 8)}...{chipiPublicKey.slice(-6)}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Amount (STRK) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g., 5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-400 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => setAmount(maxSafeAmount.toString())}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded hover:bg-purple-500/30 transition-colors"
            >
              Max Safe ({maxSafeAmount})
            </button>
          </div>
        </div>

        {/* Warning Modal */}
        {showWarning && (
          <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-400 mb-2">
                  Amount Exceeds Recommendation
                </p>
                <p className="text-xs text-yellow-300 mb-3">
                  You're about to transfer {amount} STRK, which exceeds the recommended 
                  maximum of {maxSafeAmount} STRK for your Chipi wallet. This increases 
                  your risk if the wallet is compromised.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-all"
                  >
                    Adjust Amount
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-all disabled:opacity-50"
                  >
                    Proceed Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showWarning && (
          <button
            onClick={handleTransfer}
            disabled={isLoading || !amount}
            className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Transfer...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Transfer to Chipi Wallet
              </>
            )}
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <p className="text-xs text-gray-400">
          <span className="font-semibold text-purple-400">How it works:</span> Your STRK will 
          be transferred from Braavos to your Chipi wallet. You'll need to confirm the transaction 
          in your Braavos wallet extension. Standard gas fees apply for this transfer.
        </p>
      </div>
    </div>
  );
}
