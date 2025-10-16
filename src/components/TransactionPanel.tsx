"use client";

import { useState, useEffect } from "react";
import { ArrowUpCircle, ArrowDownCircle, Loader2, CheckCircle, XCircle } from "lucide-react";

interface TransactionPanelProps {
  address: string;
  vaultBalance: number | null;
  onTransactionComplete?: () => void;
}

export default function TransactionPanel({ 
  address, 
  vaultBalance,
  onTransactionComplete 
}: TransactionPanelProps) {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    const authorizeHotWallet = async () => {
      setLoading(true);
      setTxStatus({ type: null, message: "" });

      try {
        // Check if Braavos is available
        if (typeof window === "undefined" || !(window as any).starknet_braavos) {
          throw new Error("Braavos wallet not found");
        }

        const braavos = (window as any).starknet_braavos;
        const VAULT_CONTRACT = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
        const HOT_WALLET = address; // User's wallet address

        // Invoke authorize_hot on the vault contract
        const tx = await braavos.account.execute([
          {
            contractAddress: VAULT_CONTRACT,
            entrypoint: "authorize_hot",
            calldata: [HOT_WALLET],
          },
        ]);

        setTxStatus({
          type: "success",
          message: `Hot wallet authorized! Transaction hash: ${tx.transaction_hash}`,
        });
      } catch (error: any) {
        console.error("Authorization error:", error);
        setTxStatus({
          type: "error",
          message: error.message || "Failed to authorize hot wallet. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    authorizeHotWallet();
  }, [address]);

  // Deposit: Transfer STRK from Braavos to Vault Contract
  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setTxStatus({ type: "error", message: "Please enter a valid amount" });
      return;
    }

    setLoading(true);
    setTxStatus({ type: null, message: "" });

    try {
      // Check if Braavos is available
      if (typeof window === "undefined" || !(window as any).starknet_braavos) {
        throw new Error("Braavos wallet not found");
      }

      const braavos = (window as any).starknet_braavos;
      const VAULT_CONTRACT = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
      const STRK_TOKEN = process.env.NEXT_PUBLIC_STRK_TOKEN_ADDRESS || 
        "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";
      
      // Convert amount to wei (18 decimals)
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
      const amountLow = amountWei & ((BigInt(1) << BigInt(128)) - BigInt(1));
      const amountHigh = amountWei >> BigInt(128);

      // Execute transfer from Braavos to Vault
      const tx = await braavos.account.execute([
        {
          contractAddress: STRK_TOKEN,
          entrypoint: "transfer",
          calldata: [
            VAULT_CONTRACT, // recipient (vault contract)
            amountLow.toString(), // amount low
            amountHigh.toString(), // amount high
          ],
        },
      ]);

      setTxStatus({
        type: "success",
        message: `Deposit confirmed! Transaction hash: ${tx.transaction_hash}`,
      });

      setAmount("");

      // Refresh balances
      setTimeout(() => {
        if (onTransactionComplete) onTransactionComplete();
      }, 3000);

    } catch (error: any) {
      console.error("Deposit error:", error);
      setTxStatus({
        type: "error",
        message: error.message || "Failed to deposit. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Withdraw: Request withdrawal via API (uses hot wallet)
  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setTxStatus({ type: "error", message: "Please enter a valid amount" });
      return;
    }

    if (vaultBalance !== null && parseFloat(amount) > vaultBalance) {
      setTxStatus({ type: "error", message: "Insufficient vault balance" });
      return;
    }

    setLoading(true);
    setTxStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/vault/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: address, // Withdraw to user's Braavos address
          amount: parseFloat(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Withdrawal failed");
      }

      setTxStatus({
        type: "success",
        message: `Withdrawal successful! Transaction hash: ${data.transaction_hash}`,
      });

      setAmount("");
      
      // Refresh balances
      setTimeout(() => {
        if (onTransactionComplete) onTransactionComplete();
      }, 3000);

    } catch (error: any) {
      console.error("Withdraw error:", error);
      setTxStatus({
        type: "error",
        message: error.message || "Failed to withdraw. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeHotWallet = async () => {
    setLoading(true);
    setTxStatus({ type: null, message: "" });

    try {
      // Check if Braavos is available
      if (typeof window === "undefined" || !(window as any).starknet_braavos) {
        throw new Error("Braavos wallet not found");
      }

      const braavos = (window as any).starknet_braavos;
      const VAULT_CONTRACT = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
      const HOT_WALLET = address; // User's wallet address

      // Invoke authorize_hot on the vault contract
      const tx = await braavos.account.execute([
        {
          contractAddress: VAULT_CONTRACT,
          entrypoint: "authorize_hot",
          calldata: [HOT_WALLET],
        },
      ]);

      setTxStatus({
        type: "success",
        message: `Hot wallet authorized! Transaction hash: ${tx.transaction_hash}`,
      });
    } catch (error: any) {
      console.error("Authorization error:", error);
      setTxStatus({
        type: "error",
        message: error.message || "Failed to authorize hot wallet. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "deposit") {
      handleDeposit();
    } else {
      handleWithdraw();
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-md">
      <h3 className="text-xl font-bold text-white mb-4">Transactions</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setActiveTab("deposit");
            setTxStatus({ type: null, message: "" });
            setAmount("");
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            activeTab === "deposit"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          <ArrowUpCircle className="w-4 h-4 inline mr-2" />
          Deposit
        </button>
        <button
          onClick={() => {
            setActiveTab("withdraw");
            setTxStatus({ type: null, message: "" });
            setAmount("");
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            activeTab === "withdraw"
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          <ArrowDownCircle className="w-4 h-4 inline mr-2" />
          Withdraw
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Amount (STRK)
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0000"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          {vaultBalance !== null && activeTab === "withdraw" && (
            <p className="text-xs text-gray-500 mt-1">
              Available: {vaultBalance.toFixed(4)} STRK
            </p>
          )}
        </div>

        {activeTab === "deposit" && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-400">
              ℹ️ <strong>Automated Deposit Flow:</strong>
              <br />
              1. Transfer STRK from Braavos to Vault contract ✅
              <br />
              2. System automatically credits your vault balance ✅
              <br />
              3. Balance updates in ChipiPay Vault card ✅
              <br />
              <strong className="text-emerald-400">⚡ Fully automated - no admin needed!</strong>
            </p>
          </div>
        )}

        {activeTab === "withdraw" && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
            <p className="text-xs text-purple-400">
              ℹ️ <strong>Withdraw Flow:</strong>
              <br />
              1. Vault checks your balance
              <br />
              2. STRK is transferred to your Braavos wallet
              <br />
              3. Vault balance is updated
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !amount}
          className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            activeTab === "deposit"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : activeTab === "deposit" ? (
            <>
              <ArrowUpCircle className="w-5 h-5" />
              Deposit to Vault
            </>
          ) : (
            <>
              <ArrowDownCircle className="w-5 h-5" />
              Withdraw to Braavos
            </>
          )}
        </button>
      </form>

      {/* Status Messages */}
      {txStatus.type && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            txStatus.type === "success"
              ? "bg-green-900/20 border border-green-500/30"
              : "bg-red-900/20 border border-red-500/30"
          }`}
        >
          <div className="flex items-start gap-3">
            {txStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                txStatus.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {txStatus.message}
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-xs text-gray-500 mb-2">Quick amounts:</p>
        <div className="flex gap-2">
          {[1, 5, 10, 50].map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => setAmount(quickAmount.toString())}
              disabled={loading}
              className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition disabled:opacity-50"
            >
              {quickAmount}
            </button>
          ))}
        </div>
      </div>

      {/* Authorize Hot Wallet Button */}
      <div className="mt-4">
        <button
          onClick={handleAuthorizeHotWallet}
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold transition bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Authorizing...
            </>
          ) : (
            "Authorize Hot Wallet"
          )}
        </button>
      </div>
    </div>
  );
}
