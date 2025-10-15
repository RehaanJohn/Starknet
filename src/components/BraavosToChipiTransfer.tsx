/**
 * Braavos to Chipi Transfer Component
 * 
 * Allows users to safely transfer funds from their Braavos wallet
 * to their Chipi wallet with amount validation and warnings
 */

"use client";

import React, { useState } from 'react';
import { ArrowRight, Wallet, CreditCard, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { DEFAULT_SECURITY_LIMITS } from '@/lib/security-config';
import { strToUint256Hex } from '@/lib/uint256';
import DevUintDebug from './DevUintDebug';
import { getErc20Balance } from '@/lib/stark';
import { useBraavosBalance } from '@/hooks/useBraavosBalance';

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
  const DEFAULT_TOKEN = '0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D';

  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [tokenAddress, setTokenAddress] = useState(DEFAULT_TOKEN);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  const maxSafeAmount = DEFAULT_SECURITY_LIMITS.maxWalletBalance;

  // Braavos on-chain STRK balance (auto-updating)
  const { balanceBig: braavosBalanceBig, balanceHuman: braavosBalanceHuman, loading: braavosBalanceLoading } = useBraavosBalance({ tokenAddress });

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

      // Prepare transaction using shared uint256 helper
      const { low, high, amountWei } = strToUint256Hex(amountNum.toString(), 18);

      console.log('Preparing transfer via helper:', { amountNum, amountWei, low, high });

      // Use the token address configured in the form (default = provided STRK token)
      const tokenForTransfer = tokenAddress || DEFAULT_TOKEN;

      const calls = [
        {
          contractAddress: tokenForTransfer,
          entrypoint: 'transfer',
          calldata: [chipiPublicKey, low, high],
        },
      ];

      setDiagnostics((d: string[]) => [...d, `Using token ${tokenForTransfer}`]);

      // Check on-chain balance before executing to avoid u256 underflow
      const braavosProvider = (window as any).starknet_braavos.provider;
      const braavosAccountObj = (window as any).starknet_braavos.account;
      const { uint256ToBigInt } = await import('@/lib/uint256');
      const { getErc20Balance } = await import('@/lib/stark');

      const braavosAddr = braavosAccountObj?.address || (await (window as any).starknet_braavos.enable())[0];
      const balanceBig = await getErc20Balance(braavosProvider, tokenForTransfer, braavosAddr);
      const amountBig = uint256ToBigInt(low, high);

      // Avoid using Number(...) on BigInt if balance is large; convert for human display safely
      const balanceHuman = Number(balanceBig) / 1e18;
      const amountHuman = Number(amountBig) / 1e18;
      console.log('=== BALANCE CHECK ===');
      console.log('Braavos address:', braavosAddr);
      console.log('On-chain balance (raw):', balanceBig.toString());
      setDiagnostics((d: string[]) => [...d, `on-chain balance (raw bigint): ${balanceBig.toString()}`]);
      console.log('On-chain balance (STRK):', balanceHuman.toFixed(6));
      console.log('Amount to send (raw):', amountBig.toString());
      console.log('Amount to send (STRK):', amountHuman.toFixed(6));
      console.log('Has enough?', balanceBig >= amountBig);

      if (balanceBig < amountBig) {
        throw new Error(
          `Insufficient STRK balance in Braavos wallet.\n` +
          `Available: ${balanceHuman.toFixed(6)} STRK\n` +
          `Needed: ${amountHuman.toFixed(6)} STRK\n\n` +
          `Please fund your Braavos wallet with STRK tokens first. ` +
          `You can get testnet STRK from a faucet or bridge funds from another wallet.`
        );
      }

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

  const handleCheckBalance = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (typeof window === 'undefined' || !window.starknet_braavos) {
        throw new Error('Braavos wallet not found');
      }

      const braavosProvider = (window as any).starknet_braavos.provider;
      const braavosAccountObj = (window as any).starknet_braavos.account;
      const { getErc20Balance } = await import('@/lib/stark');

      const braavosAddr = braavosAccountObj?.address || (await (window as any).starknet_braavos.enable())[0];
      const tokenForCheck = tokenAddress || DEFAULT_TOKEN;
      setDiagnostics((d: string[]) => [...d, `Checking balance for ${tokenForCheck} on ${braavosAddr}`]);

      const balanceBig = await getErc20Balance(braavosProvider, tokenForCheck, braavosAddr);
      const balanceHuman = Number(balanceBig) / 1e18;
      setDiagnostics((d: string[]) => [...d, `Balance: ${balanceBig.toString()} (${balanceHuman.toFixed(6)} STRK)`]);
    } catch (err: any) {
      setError(err?.message || 'Failed to check balance');
    } finally {
      setIsLoading(false);
    }
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-orange-400 font-mono break-all">
                {braavosAddress.slice(0, 8)}...{braavosAddress.slice(-6)}
              </p>
              <p className="text-xs text-gray-400">
                {braavosBalanceLoading ? 'Checking...' : (braavosBalanceHuman != null ? `${braavosBalanceHuman.toFixed(4)} STRK` : '—')}
              </p>
            </div>
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

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleCheckBalance}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-all disabled:opacity-50"
          >
            Check balance
          </button>

          <input
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-xs"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="Token contract address (STRK)"
          />
        </div>

          {/* Dev debug info for Uint256 encoding */}
          <div className="mt-3">
            <DevUintDebug amount={amount} />
          </div>
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
