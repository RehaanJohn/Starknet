'use client';

import React, { useState } from 'react';
import { useSendTransaction } from '@chipi-stack/nextjs';
import { Send, Loader2 } from 'lucide-react';

interface ChipiPaymentProps {
  userId: string;
  bearerToken: string;
  chipiWallet: any;
}

export default function ChipiPayment({ userId, bearerToken, chipiWallet }: ChipiPaymentProps) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [encryptKey, setEncryptKey] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const { sendTransactionAsync, isLoading } = useSendTransaction();

  const handleSendPayment = async () => {
    setError('');
    setTxHash('');

    if (!recipientAddress || !amount || !encryptKey) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await sendTransactionAsync({
        params: {
          encryptKey,
          externalUserId: userId,
          to: recipientAddress,
          amount,
          tokenAddress: tokenAddress || undefined, // Optional: leave empty for native token
        },
        bearerToken,
      });

      console.log('Transaction successful:', response);
      setTxHash(response.txHash || 'Transaction sent');
      
      // Clear form
      setRecipientAddress('');
      setAmount('');
      setTokenAddress('');
      setEncryptKey('');
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to send payment');
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
          onClick={handleSendPayment}
          disabled={isLoading}
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

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mt-4">
        <p className="text-xs text-gray-400">
          <span className="font-semibold text-emerald-400">Note:</span> Transactions on Chipi Pay are gasless. 
          Your payment will be processed without requiring gas fees from your wallet.
        </p>
      </div>
    </div>
  );
}