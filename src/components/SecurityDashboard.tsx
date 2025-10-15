/**
 * Security Dashboard Component
 * 
 * Displays wallet security status, transaction history,
 * spending analytics, and emergency controls
 */

'use client';

import React from 'react';
import { Shield, AlertTriangle, Clock, TrendingUp, Lock, Unlock, Trash2 } from 'lucide-react';
import { useWalletSecurity } from '@/hooks/useWalletSecurity';

export default function SecurityDashboard() {
  const {
    isFrozen,
    dailySpent,
    transactionHistory,
    recentTransactions,
    freezeWallet,
    unfreezeWallet,
    clearHistory,
    limits,
  } = useWalletSecurity();

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const dailyLimit = limits.dailySpendingLimit;
  const dailyProgress = (dailySpent / dailyLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Security Status Card */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold">Security Dashboard</h3>
          </div>
          
          {/* Emergency Freeze Button */}
          {isFrozen ? (
            <button
              onClick={unfreezeWallet}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-gray-900 rounded-lg font-semibold hover:bg-emerald-400 transition-all"
            >
              <Unlock className="w-4 h-4" />
              Unfreeze Wallet
            </button>
          ) : (
            <button
              onClick={freezeWallet}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-400 transition-all"
            >
              <Lock className="w-4 h-4" />
              Emergency Freeze
            </button>
          )}
        </div>

        {/* Status Alert */}
        {isFrozen && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-sm font-semibold text-red-400">Wallet is Currently Frozen</p>
            </div>
            <p className="text-xs text-red-300 mt-2">
              All transactions are disabled. Click "Unfreeze Wallet" to resume normal operations.
            </p>
          </div>
        )}

        {/* Security Limits Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Max Transaction</p>
            <p className="text-2xl font-bold text-white">{limits.maxTransactionAmount} STRK</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Max Wallet Balance</p>
            <p className="text-2xl font-bold text-white">{limits.maxWalletBalance} STRK</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Rate Limit</p>
            <p className="text-2xl font-bold text-white">{limits.maxTransactionsPerHour} tx/hour</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Session Timeout</p>
            <p className="text-2xl font-bold text-white">{limits.sessionTimeout} min</p>
          </div>
        </div>
      </div>

      {/* Daily Spending Tracker */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold">Daily Spending</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Spent Today</span>
              <span className="text-white font-semibold">
                {dailySpent.toFixed(2)} / {dailyLimit} STRK
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  dailyProgress > 80 ? 'bg-red-500' : 
                  dailyProgress > 50 ? 'bg-yellow-500' : 
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(dailyProgress, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Remaining</p>
              <p className="text-lg font-bold text-emerald-400">
                {Math.max(0, dailyLimit - dailySpent).toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Used</p>
              <p className="text-lg font-bold text-white">
                {((dailySpent / dailyLimit) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Resets In</p>
              <p className="text-lg font-bold text-gray-300">
                {24 - new Date().getHours()}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold">Transaction History</h3>
          </div>
          
          {transactionHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 px-3 py-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {transactionHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactionHistory.slice(0, 20).map((tx) => (
              <div
                key={tx.id}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tx.status === 'success' ? 'bg-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}
                    />
                    <span className="text-sm font-semibold text-white">
                      {tx.amount} STRK
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(tx.timestamp)} {formatTime(tx.timestamp)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">To:</span>
                  <span className="text-gray-300 font-mono">
                    {formatAddress(tx.recipient)}
                  </span>
                </div>

                {tx.txHash && (
                  <div className="mt-2 text-xs text-gray-500 font-mono break-all">
                    Hash: {tx.txHash}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Summary */}
      {recentTransactions.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-semibold text-yellow-400">Recent Activity</p>
          </div>
          <p className="text-xs text-yellow-300 mt-2">
            {recentTransactions.length} transaction(s) in the last hour. 
            Rate limit: {limits.maxTransactionsPerHour - recentTransactions.length} remaining this hour.
          </p>
        </div>
      )}
    </div>
  );
}
