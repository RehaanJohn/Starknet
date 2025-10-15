/**
 * Transaction Confirmation Modal Component
 * 
 * Shows security warnings and requires explicit confirmation
 * for transactions above the threshold
 */

import React from 'react';
import { AlertTriangle, Shield, X } from 'lucide-react';

interface TransactionConfirmationProps {
  isOpen: boolean;
  amount: string;
  recipient: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function TransactionConfirmation({
  isOpen,
  amount,
  recipient,
  onConfirm,
  onCancel,
  loading = false,
}: TransactionConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-2xl p-6 max-w-md w-full space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Confirm Transaction</h3>
              <p className="text-sm text-gray-400">Please review before proceeding</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Amount</p>
            <p className="text-2xl font-bold text-emerald-400">{amount} STRK</p>
          </div>
          
          <div>
            <p className="text-xs text-gray-400 mb-1">Recipient</p>
            <p className="text-sm text-white font-mono break-all">{recipient}</p>
          </div>
        </div>

        {/* Security Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-semibold mb-1">Security Reminder</p>
              <ul className="text-xs space-y-1 text-yellow-300/80">
                <li>• Double-check the recipient address</li>
                <li>• Transactions cannot be reversed</li>
                <li>• Only send to trusted addresses</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-emerald-500 text-gray-900 rounded-lg font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Confirm & Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
