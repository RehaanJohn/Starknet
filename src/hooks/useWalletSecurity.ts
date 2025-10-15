/**
 * Custom React Hook for Wallet Security Management
 * 
 * Handles:
 * - Transaction validation
 * - Rate limiting
 * - Daily spending tracking
 * - Session management
 * - Wallet freeze/unfreeze
 */

import { useState, useEffect, useCallback } from 'react';
import {
  SecurityLimits,
  DEFAULT_SECURITY_LIMITS,
  WalletSecurityState,
  TransactionRecord,
  validateTransaction,
  generateTransactionId,
  shouldResetDailySpending,
  ValidationResult,
} from '../lib/security-config';

const STORAGE_KEY_SECURITY_STATE = 'chipi_wallet_security_state';
const STORAGE_KEY_TRANSACTIONS = 'chipi_wallet_transactions';

export function useWalletSecurity(limits: SecurityLimits = DEFAULT_SECURITY_LIMITS) {
  const [securityState, setSecurityState] = useState<WalletSecurityState>(() => {
    if (typeof window === 'undefined') {
      return {
        isFrozen: false,
        lastActivity: Date.now(),
        dailySpent: 0,
        dailyResetTime: Date.now(),
        transactionHistory: [],
      };
    }

    const stored = localStorage.getItem(STORAGE_KEY_SECURITY_STATE);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse security state:', e);
      }
    }

    return {
      isFrozen: false,
      lastActivity: Date.now(),
      dailySpent: 0,
      dailyResetTime: Date.now(),
      transactionHistory: [],
    };
  });

  // Persist security state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SECURITY_STATE, JSON.stringify(securityState));
    }
  }, [securityState]);

  // Update last activity on user interaction
  const updateActivity = useCallback(() => {
    setSecurityState((prev) => ({
      ...prev,
      lastActivity: Date.now(),
    }));
  }, []);

  // Check and reset daily spending if new day
  useEffect(() => {
    if (shouldResetDailySpending(securityState.dailyResetTime)) {
      setSecurityState((prev) => ({
        ...prev,
        dailySpent: 0,
        dailyResetTime: Date.now(),
      }));
    }
  }, [securityState.dailyResetTime]);

  // Freeze wallet
  const freezeWallet = useCallback(() => {
    setSecurityState((prev) => ({
      ...prev,
      isFrozen: true,
    }));
  }, []);

  // Unfreeze wallet
  const unfreezeWallet = useCallback(() => {
    setSecurityState((prev) => ({
      ...prev,
      isFrozen: false,
    }));
  }, []);

  // Validate a transaction before sending
  const validateTransactionSecurity = useCallback(
    (amount: number): ValidationResult => {
      return validateTransaction(amount, securityState, limits);
    },
    [securityState, limits]
  );

  // Record a new transaction
  const recordTransaction = useCallback(
    (amount: number, recipient: string, txHash?: string) => {
      const transaction: TransactionRecord = {
        id: generateTransactionId(),
        timestamp: Date.now(),
        amount,
        recipient,
        status: txHash ? 'success' : 'pending',
        txHash,
      };

      setSecurityState((prev) => {
        const updatedHistory = [transaction, ...prev.transactionHistory].slice(0, 50); // Keep last 50
        
        return {
          ...prev,
          dailySpent: prev.dailySpent + amount,
          transactionHistory: updatedHistory,
          lastActivity: Date.now(),
        };
      });

      return transaction.id;
    },
    []
  );

  // Update transaction status
  const updateTransactionStatus = useCallback(
    (txId: string, status: 'success' | 'failed', txHash?: string) => {
      setSecurityState((prev) => ({
        ...prev,
        transactionHistory: prev.transactionHistory.map((tx) =>
          tx.id === txId ? { ...tx, status, txHash } : tx
        ),
      }));
    },
    []
  );

  // Get today's spending
  const getTodaySpending = useCallback(() => {
    if (shouldResetDailySpending(securityState.dailyResetTime)) {
      return 0;
    }
    return securityState.dailySpent;
  }, [securityState.dailySpent, securityState.dailyResetTime]);

  // Remaining daily allowance (how much more the user can spend today)
  const getRemainingDailyAllowance = useCallback(() => {
    const spent = getTodaySpending();
    return Math.max(0, limits.dailySpendingLimit - spent);
  }, [getTodaySpending, limits.dailySpendingLimit]);

  // Get recent transactions (last hour)
  const getRecentTransactions = useCallback(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return securityState.transactionHistory.filter(
      (tx) => tx.timestamp > oneHourAgo
    );
  }, [securityState.transactionHistory]);

  // How many transactions remaining in the current hour before hitting the rate limit
  const getRemainingHourlyTxs = useCallback(() => {
    const recent = getRecentTransactions();
    const recentCount = recent.filter((tx) => tx.status !== 'failed').length;
    return Math.max(0, limits.maxTransactionsPerHour - recentCount);
  }, [getRecentTransactions, limits.maxTransactionsPerHour]);

  // Convenience wrapper to check whether a given amount may be sent now
  const canSendAmount = useCallback(
    (amount: number) => {
      return validateTransaction(amount, securityState, limits);
    },
    [securityState, limits]
  );

  // Clear transaction history
  const clearHistory = useCallback(() => {
    setSecurityState((prev) => ({
      ...prev,
      transactionHistory: [],
    }));
  }, []);

  return {
    securityState,
    isFrozen: securityState.isFrozen,
    dailySpent: getTodaySpending(),
    transactionHistory: securityState.transactionHistory,
    recentTransactions: getRecentTransactions(),
    validateTransactionSecurity,
    recordTransaction,
    updateTransactionStatus,
    freezeWallet,
    unfreezeWallet,
    updateActivity,
    clearHistory,
    limits,
  };
}
