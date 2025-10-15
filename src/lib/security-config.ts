/**
 * Security Configuration for Chipi Wallet
 * 
 * This implements a layered security approach:
 * - Spending limits (per transaction, daily, wallet maximum)
 * - Rate limiting
 * - Session management
 * - Transaction monitoring
 */

export interface SecurityLimits {
  // Maximum balance allowed in Chipi wallet (in STRK)
  maxWalletBalance: number;
  
  // Maximum amount per single transaction (in STRK)
  maxTransactionAmount: number;
  
  // Maximum total spending per day (in STRK)
  dailySpendingLimit: number;
  
  // Maximum number of transactions per hour
  maxTransactionsPerHour: number;
  
  // Amount threshold that requires confirmation (in STRK)
  confirmationThreshold: number;
  
  // Session timeout in minutes
  sessionTimeout: number;
}

export const DEFAULT_SECURITY_LIMITS: SecurityLimits = {
  maxWalletBalance: 10, // Only keep 10 STRK in Chipi wallet
  maxTransactionAmount: 2, // Max 2 STRK per transaction
  dailySpendingLimit: 5, // Max 5 STRK per day
  maxTransactionsPerHour: 3, // Max 3 transactions per hour
  confirmationThreshold: 1, // Confirm transactions > 1 STRK
  sessionTimeout: 15, // 15 minute session timeout
};

export interface TransactionRecord {
  id: string;
  timestamp: number;
  amount: number;
  recipient: string;
  status: 'pending' | 'success' | 'failed';
  txHash?: string;
}

export interface WalletSecurityState {
  isFrozen: boolean;
  lastActivity: number;
  dailySpent: number;
  dailyResetTime: number;
  transactionHistory: TransactionRecord[];
}

/**
 * Check if daily spending limit would be exceeded
 */
export function wouldExceedDailyLimit(
  currentDailySpent: number,
  newAmount: number,
  limits: SecurityLimits
): boolean {
  return currentDailySpent + newAmount > limits.dailySpendingLimit;
}

/**
 * Check if transaction amount exceeds single transaction limit
 */
export function exceedsTransactionLimit(
  amount: number,
  limits: SecurityLimits
): boolean {
  return amount > limits.maxTransactionAmount;
}

/**
 * Check if rate limit is exceeded (transactions per hour)
 */
export function exceedsRateLimit(
  recentTransactions: TransactionRecord[],
  limits: SecurityLimits
): boolean {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentTxCount = recentTransactions.filter(
    (tx) => tx.timestamp > oneHourAgo && tx.status !== 'failed'
  ).length;
  
  return recentTxCount >= limits.maxTransactionsPerHour;
}

/**
 * Check if session has expired
 */
export function isSessionExpired(
  lastActivity: number,
  limits: SecurityLimits
): boolean {
  const sessionTimeoutMs = limits.sessionTimeout * 60 * 1000;
  return Date.now() - lastActivity > sessionTimeoutMs;
}

/**
 * Reset daily spending counter if it's a new day
 */
export function shouldResetDailySpending(dailyResetTime: number): boolean {
  const now = new Date();
  const resetTime = new Date(dailyResetTime);
  
  return (
    now.getDate() !== resetTime.getDate() ||
    now.getMonth() !== resetTime.getMonth() ||
    now.getFullYear() !== resetTime.getFullYear()
  );
}

/**
 * Generate a unique transaction ID
 */
export function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate transaction against all security rules
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
  requiresConfirmation: boolean;
}

export function validateTransaction(
  amount: number,
  securityState: WalletSecurityState,
  limits: SecurityLimits
): ValidationResult {
  // Check if wallet is frozen
  if (securityState.isFrozen) {
    return {
      valid: false,
      reason: 'Wallet is frozen for security reasons. Please unfreeze to continue.',
      requiresConfirmation: false,
    };
  }

  // Check session timeout
  if (isSessionExpired(securityState.lastActivity, limits)) {
    return {
      valid: false,
      reason: 'Session expired. Please re-authenticate.',
      requiresConfirmation: false,
    };
  }

  // Check single transaction limit
  if (exceedsTransactionLimit(amount, limits)) {
    return {
      valid: false,
      reason: `Transaction amount (${amount} STRK) exceeds maximum limit of ${limits.maxTransactionAmount} STRK per transaction.`,
      requiresConfirmation: false,
    };
  }

  // Check daily spending limit
  let dailySpent = securityState.dailySpent;
  if (shouldResetDailySpending(securityState.dailyResetTime)) {
    dailySpent = 0;
  }

  if (wouldExceedDailyLimit(dailySpent, amount, limits)) {
    return {
      valid: false,
      reason: `This transaction would exceed your daily spending limit. Spent today: ${dailySpent.toFixed(2)} STRK, Limit: ${limits.dailySpendingLimit} STRK`,
      requiresConfirmation: false,
    };
  }

  // Check rate limiting
  if (exceedsRateLimit(securityState.transactionHistory, limits)) {
    return {
      valid: false,
      reason: `Too many transactions. Maximum ${limits.maxTransactionsPerHour} transactions per hour allowed.`,
      requiresConfirmation: false,
    };
  }

  // Check if confirmation is required
  const requiresConfirmation = amount >= limits.confirmationThreshold;

  return {
    valid: true,
    requiresConfirmation,
  };
}
