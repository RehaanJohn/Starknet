"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Wallet, CreditCard, RefreshCw, Send, Plus, Snowflake, ShieldOff } from "lucide-react";
import { useBraavosBalance } from "@/hooks/useBraavosBalance";
import { useVaultBalance } from "@/hooks/useVaultBalance";
import { useGetWallet } from "@chipi-stack/nextjs";
import { useAuth } from "@clerk/nextjs";

export default function WalletDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [braavosAddress, setBraavosAddress] = useState<string | null>(null);
  const [braavosConnected, setBraavosConnected] = useState(false);
  const [bearerToken, setBearerToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch Braavos balance
  const { balanceHuman: braavosBalance, loading: braavosLoading } = useBraavosBalance();

  // Get ChipiPay wallet
  const { data: walletData } = useGetWallet({
    params: { externalUserId: userId || "" },
    getBearerToken: async () => {
      if (bearerToken) return bearerToken;
      const token = await getToken();
      setBearerToken(token || null);
      return token || "";
    },
  });

  // Fetch vault balance for ChipiPay wallet
  const chipiAddress = walletData ? (walletData as any).starknetAddress || (walletData as any).publicKey || null : null;
  const { balanceHuman: vaultBalance, loading: vaultLoading, error: vaultError } = useVaultBalance({
    address: chipiAddress,
  });

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
    (async () => {
      try {
        const token = await getToken();
        if (token) setBearerToken(token);
      } catch (err) {
        // ignore
      }
    })();
    
    // Check if Braavos is already connected
    checkBraavosConnection();
  }, [user, getToken]);

  const checkBraavosConnection = async () => {
    if (typeof window !== "undefined" && (window as any).starknet_braavos) {
      try {
        const braavos = (window as any).starknet_braavos;
        if (braavos.isConnected && braavos.selectedAddress) {
          setBraavosAddress(braavos.selectedAddress);
          setBraavosConnected(true);
        }
      } catch (err) {
        console.log("Braavos not yet connected");
      }
    }
  };

  // Connect Braavos wallet
  const connectBraavos = async () => {
    if (typeof window !== "undefined" && (window as any).starknet_braavos) {
      try {
        setIsConnecting(true);
        const braavos = (window as any).starknet_braavos;
        const result = await braavos.enable({ starknetVersion: "v5" });
        const address = Array.isArray(result) ? result[0] : result;
        
        setBraavosAddress(address);
        setBraavosConnected(true);
        alert(`✅ Braavos Connected!\nAddress: ${address.slice(0, 6)}...${address.slice(-4)}`);
      } catch (err) {
        console.error("Failed to connect Braavos:", err);
        alert("Failed to connect Braavos wallet. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("Braavos wallet not detected. Please install the Braavos browser extension.");
      window.open("https://braavos.app/download-braavos-wallet/", "_blank");
    }
  };

  const handleSetBalance = async () => {
    if (!chipiAddress) {
      alert("ChipiPay wallet not found");
      return;
    }
    
    const amount = prompt("Enter amount to set (in STRK):");
    if (!amount) return;
    
    try {
      const response = await fetch("/api/vault/set-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: chipiAddress,
          amount: parseFloat(amount),
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(`Balance set successfully! Tx: ${data.transaction_hash}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to set balance");
    }
  };

  const handleWithdraw = async () => {
    if (!chipiAddress) {
      alert("ChipiPay wallet not found");
      return;
    }
    
    const amount = prompt("Enter amount to withdraw (in STRK):");
    if (!amount) return;
    
    const recipient = prompt("Enter recipient address:", chipiAddress);
    if (!recipient) return;
    
    try {
      const response = await fetch("/api/vault/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          amount: parseFloat(amount),
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(`Withdrawal successful! Tx: ${data.transaction_hash}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to withdraw");
    }
  };

  const handleFreeze = async () => {
    if (!confirm("Are you sure you want to freeze the vault? This will stop all withdrawals.")) {
      return;
    }
    
    try {
      const response = await fetch("/api/vault/freeze", {
        method: "POST",
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(`Vault frozen! Tx: ${data.transaction_hash}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to freeze vault");
    }
  };

  const handleUnfreeze = async () => {
    try {
      const response = await fetch("/api/vault/unfreeze", {
        method: "POST",
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(`Vault unfrozen! Tx: ${data.transaction_hash}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to unfreeze vault");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, {user?.firstName || user?.username || "User"}!
          </h1>
          <p className="text-gray-300">Manage your wallets and vault balances</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Braavos Wallet Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Braavos Wallet</h2>
              </div>
              {!braavosConnected && (
                <button
                  onClick={connectBraavos}
                  disabled={isConnecting}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
            
            <div className="mt-6">
              {braavosConnected ? (
                braavosLoading ? (
                  <div className="flex items-center gap-2 text-white/80">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading balance...</span>
                  </div>
                ) : braavosBalance !== null ? (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">
                      {braavosBalance.toFixed(4)} STRK
                    </p>
                    <p className="text-blue-200 text-sm flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                      Connected: {braavosAddress ? `${braavosAddress.slice(0, 6)}...${braavosAddress.slice(-4)}` : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">0.0000 STRK</p>
                    <p className="text-blue-200 text-sm flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                      Connected: {braavosAddress ? `${braavosAddress.slice(0, 6)}...${braavosAddress.slice(-4)}` : ""}
                    </p>
                  </>
                )
              ) : (
                <div>
                  <p className="text-white/80 mb-2">Not connected</p>
                  <p className="text-blue-200 text-xs">Click "Connect" to link your Braavos wallet</p>
                </div>
              )}
            </div>
          </div>

          {/* ChipiPay Vault Card */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">ChipiPay Vault</h2>
              </div>
            </div>
            
            <div className="mt-6">
              {vaultLoading ? (
                <div className="flex items-center gap-2 text-white/80">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : vaultError ? (
                <p className="text-red-200 text-sm">{vaultError}</p>
              ) : vaultBalance !== null ? (
                <>
                  <p className="text-3xl font-bold text-white mb-1">
                    {vaultBalance.toFixed(4)} STRK
                  </p>
                  <p className="text-purple-200 text-sm">
                    {chipiAddress ? `${chipiAddress.slice(0, 6)}...${chipiAddress.slice(-4)}` : "No wallet"}
                  </p>
                </>
              ) : (
                <p className="text-white/80">No balance found</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-6">Vault Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Set Balance (Owner Only) */}
            <button
              onClick={handleSetBalance}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Set Balance
            </button>

            {/* Withdraw */}
            <button
              onClick={handleWithdraw}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Withdraw
            </button>

            {/* Freeze Vault (Owner Only) */}
            <button
              onClick={handleFreeze}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-4 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <Snowflake className="w-5 h-5" />
              Freeze Vault
            </button>

            {/* Unfreeze Vault (Owner Only) */}
            <button
              onClick={handleUnfreeze}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white p-4 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <ShieldOff className="w-5 h-5" />
              Unfreeze Vault
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
            <p className="text-blue-200 text-sm">
              <strong>Note:</strong> Some actions (Set Balance, Freeze, Unfreeze) are owner-only operations. 
              Make sure you have the proper permissions before attempting these actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
