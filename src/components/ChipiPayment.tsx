'use client';

import React, { useState } from 'react';
import { useTransfer } from '@chipi-stack/nextjs';
import { Send, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useWalletSecurity } from '@/hooks/useWalletSecurity';
import { useBalance } from '@/hooks/useBalance';
import { useBraavosBalance } from '@/hooks/useBraavosBalance';
import TransactionConfirmation from './TransactionConfirmation';

interface ChipiPaymentProps {
  userId: string;
  bearerToken?: string;
  chipiWallet: any;
}

export default function ChipiPayment({ userId, bearerToken, chipiWallet }: ChipiPaymentProps) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [encryptKey, setEncryptKey] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  const { transferAsync, isLoading } = useTransfer();
  // Chipi wallet balance (returns STRK-like human number)
  const { balance: chipiBalance, loading: chipiBalanceLoading } = useBalance({ address: chipiWallet?.address || null });
  // Braavos balance (STRK)
  const { balanceHuman: braavosBalanceHuman, loading: braavosBalanceLoading } = useBraavosBalance();
  // Use security hook
  const {
    isFrozen,
    dailySpent,
    validateTransactionSecurity,
    recordTransaction,
    updateTransactionStatus,
    limits,
  } = useWalletSecurity();

  const initiatePayment = async () => {
    setError('');
    setTxHash('');

    if (!recipientAddress || !amount || !encryptKey) {
      setError('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Validate transaction against security rules
    const validation = validateTransactionSecurity(amountNum);
    
    if (!validation.valid) {
      setError(validation.reason || 'Transaction validation failed');
      return;
    }

    // If validation requires confirmation, show modal
    if (validation.requiresConfirmation) {
      setShowConfirmation(true);
      return;
    }

    // Otherwise, proceed directly
    await executeSendPayment();
  };

  const executeSendPayment = async () => {
    setShowConfirmation(false);
    const amountNum = parseFloat(amount);

    try {
      // Record transaction (returns transaction ID)
      const txId = recordTransaction(amountNum, recipientAddress);
      setPendingTransactionId(txId);

      // Prepare transfer params
      const params: any = {
        encryptKey,
        wallet: chipiWallet,
        recipient: recipientAddress,
        amount,
      };

      if (tokenAddress) {
        params.token = 'OTHER';
        params.otherToken = { contractAddress: tokenAddress, decimals: 18 };
      } else {
        params.token = 'ETH';
      }

      const txHash = await transferAsync({
        params,
        bearerToken: bearerToken || '',
      });

      const hashString = typeof txHash === 'string' ? txHash : 'Transaction sent';
      console.log('Transaction successful:', hashString);
      setTxHash(hashString);

      // Update transaction status to success
      if (txId) {
        updateTransactionStatus(txId, 'success', hashString);
      }
      
      // Clear form
      setRecipientAddress('');
      setAmount('');
      setTokenAddress('');
      setEncryptKey('');
      setPendingTransactionId(null);
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to send payment');
      
      // Update transaction status to failed
      if (pendingTransactionId) {
        updateTransactionStatus(pendingTransactionId, 'failed');
      }
      setPendingTransactionId(null);
    }
  };

  if (!chipiWallet) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <p className="text-gray-400 text-center">
          Please create a Chipi Wallet first to send payments
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-5 h-5 text-emerald-400" />
        <h3 className="text-xl font-bold text-emerald-400">Send Payment</h3>
      </div>

      {/* Chipi Wallet Balance */}
      <div className="mb-4 text-sm text-gray-300">
        <p className="font-semibold text-emerald-300">Chipi Wallet</p>
        <div className="flex items-center gap-4">
          {chipiBalanceLoading ? (
            <p className="text-xs text-gray-400">Loading balance...</p>
          ) : chipiBalance != null ? (
            <p className="text-xs text-gray-200">Chipi: {chipiBalance.toFixed(6)} STRK</p>
          ) : (
            <p className="text-xs text-gray-400">Chipi: —</p>
          )}

          {braavosBalanceLoading ? (
            <p className="text-xs text-gray-400">Checking Braavos...</p>
          ) : braavosBalanceHuman != null ? (
            <p className="text-xs text-gray-200">Braavos: {braavosBalanceHuman.toFixed(6)} STRK</p>
          ) : (
            <p className="text-xs text-gray-400">Braavos: —</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {txHash && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
          <p className="font-semibold">Transaction Successful!</p>
          <p className="text-xs mt-1 break-all">Hash: {txHash}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Recipient Address <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-emerald-400 focus:outline-none font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Amount <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Token Address (Optional)
          </label>
          <input
            type="text"
            placeholder="Leave empty for native token (ETH)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-emerald-400 focus:outline-none font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to send native Starknet ETH
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Encryption Key <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            placeholder="Enter your wallet encryption key"
            value={encryptKey}
            onChange={(e) => setEncryptKey(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <button
          onClick={initiatePayment}
          disabled={isLoading || isFrozen}
          className="w-full bg-emerald-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending Payment...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Payment
            </>
          )}
        </button>
      </div>

      {/* Security Info */}
      <div className="space-y-2">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-semibold text-emerald-400">Security Limits Active</p>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Max per transaction: {limits.maxTransactionAmount} STRK</p>
            <p>• Daily limit: {limits.dailySpendingLimit} STRK (Spent today: {dailySpent.toFixed(2)} STRK)</p>
            <p>• Rate limit: {limits.maxTransactionsPerHour} transactions/hour</p>
          </div>
        </div>

        {isFrozen && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-xs font-semibold text-red-400">Wallet Frozen</p>
            </div>
            <p className="text-xs text-red-300 mt-1">
              Transactions are disabled for security reasons. Go to settings to unfreeze.
            </p>
          </div>
        )}

        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-emerald-400">Gasless:</span> Transactions on Chipi Pay don't require gas fees from your wallet.
          </p>
        </div>
      </div>

      {/* Transaction Confirmation Modal */}
      <TransactionConfirmation
        isOpen={showConfirmation}
        amount={amount}
        recipient={recipientAddress}
        onConfirm={executeSendPayment}
        onCancel={() => setShowConfirmation(false)}
        loading={isLoading}
      />
    </div>
  );
}