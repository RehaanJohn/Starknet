"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Lock,
  Network,
} from "lucide-react";
import { useGetWallet, useCreateWallet } from "@chipi-stack/nextjs";
import ChipiPayment from "@/components/ChipiPayment";
import SecurityDashboard from "@/components/SecurityDashboard";
import BraavosToChipiTransfer from "@/components/BraavosToChipiTransfer";
import { useUser, useAuth } from "@clerk/nextjs";

export default function WalletDashboard() {
  const [braavosConnected, setBraavosConnected] = useState(false);
  const [braavosAddress, setBraavosAddress] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [bearerToken, setBearerToken] = useState<string | null>(null);
  const { user } = useUser();
  const { getToken } = useAuth();
  const [encryptKey, setEncryptKey] = useState("");
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [copied, setCopied] = useState<string>("");

  const {
    data: chipiWallet,
    isLoading: isLoadingWallet,
    refetch,
  } = useGetWallet({
    params: { externalUserId: userId || "" },
    getBearerToken: async () => {
      if (bearerToken) return bearerToken;
      const token = await getToken();
      setBearerToken(token || null);
      return token || "";
    },
  });

  const { createWalletAsync, isLoading: isCreatingWallet } = useCreateWallet();

  useEffect(() => {
    if (user) setUserId(user.id);
    checkBraavosConnection();
    (async () => {
      try {
        const token = await getToken();
        if (token) setBearerToken(token);
      } catch (err) {
        // ignore
      }
    })();
  }, [user]);

  const checkBraavosConnection = async () => {
    if (typeof window !== "undefined" && window.starknet_braavos) {
      try {
        const [address] = await window.starknet_braavos.enable();
        if (address) {
          setBraavosAddress(address);
          setBraavosConnected(true);
        }
      } catch (error) {
        console.log("Braavos not connected");
      }
    }
  };

  const connectBraavos = async () => {
    if (typeof window === "undefined" || !window.starknet_braavos) {
      alert("Please install Braavos wallet extension");
      window.open("https://braavos.app/download-braavos-wallet/", "_blank");
      return;
    }

    try {
      const [address] = await window.starknet_braavos.enable();
      if (address) {
        setBraavosAddress(address);
        setBraavosConnected(true);
      }
    } catch (error) {
      console.error("Failed to connect Braavos:", error);
      alert("Failed to connect Braavos wallet");
    }
  };

  const handleCreateChipiWallet = async () => {
    if (!encryptKey || encryptKey.length < 8) {
      alert("Please enter an encryption key (minimum 8 characters)");
      return;
    }

    if (!userId || !bearerToken) {
      alert("Please sign in first");
      return;
    }

    try {
      await createWalletAsync({
        params: {
          encryptKey,
          externalUserId: userId,
        },
        bearerToken,
      });

      setShowCreateWallet(false);
      setEncryptKey("");
      refetch();
      alert("Chipi Wallet created successfully!");
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      alert(error.message || "Failed to create Chipi wallet");
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900/80 border border-emerald-500/30 rounded-3xl p-12 max-w-md w-full text-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
          <p className="text-gray-400 mb-8">
            Sign in to access your Fiflow wallet dashboard
          </p>
          <a
            href="/auth?mode=login"
            className="inline-block bg-emerald-500 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-400 transition-all hover:scale-105"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Fiflow Dashboard</h1>
                <p className="text-xs text-gray-500">Manage your wallets</p>
              </div>
            </div>
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-emerald-400 transition-colors font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Wallets Overview Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Your Wallets</h2>
            <p className="text-gray-400">
              Connect and manage your Starknet wallets
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Braavos Wallet Card */}
            <div className="group relative bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-3xl p-8 hover:border-orange-500/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Braavos Wallet
                      </h3>
                      <p className="text-xs text-gray-500">
                        Standard Starknet Wallet
                      </p>
                    </div>
                  </div>
                  {braavosConnected && (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      Connected
                    </span>
                  )}
                </div>

                {braavosConnected ? (
                  <div className="space-y-4">
                    <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-5 border border-gray-800">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                        Wallet Address
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-orange-400 font-mono text-sm font-medium">
                          {formatAddress(braavosAddress)}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(braavosAddress, "braavos")
                          }
                          className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                        >
                          {copied === "braavos" ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 hover:text-orange-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-800/30 rounded-xl p-4">
                      <Network className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <p>
                        Connected to Starknet Mainnet. Use for standard
                        transactions.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Connect your Braavos wallet to access the full Starknet
                      ecosystem and manage your assets.
                    </p>
                    <button
                      onClick={connectBraavos}
                      className="w-full bg-orange-500 text-white px-6 py-4 rounded-2xl font-bold hover:bg-orange-400 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-5 h-5" />
                      Connect Braavos Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chipi Wallet Card */}
            <div className="group relative bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-3xl p-8 hover:border-purple-500/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Chipi Wallet
                      </h3>
                      <p className="text-xs text-gray-500">
                        Gasless Transactions
                      </p>
                    </div>
                  </div>
                  {chipiWallet && (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      Active
                    </span>
                  )}
                </div>

                {isLoadingWallet ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                    <p className="text-sm text-gray-400">Loading wallet...</p>
                  </div>
                ) : chipiWallet ? (
                  <div className="space-y-4">
                    <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-5 border border-gray-800">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                        Public Key
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-purple-400 font-mono text-sm font-medium">
                          {formatAddress(chipiWallet.publicKey)}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(chipiWallet.publicKey, "chipi")
                          }
                          className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
                        >
                          {copied === "chipi" ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-500/10 to-purple-500/10 border border-emerald-500/20 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm text-emerald-400 font-semibold mb-1">
                            Gasless Transactions Enabled
                          </p>
                          <p className="text-xs text-gray-400">
                            Send payments without paying gas fees on Starknet
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Create a Chipi wallet to enjoy gasless transactions and
                      seamless payments on Starknet.
                    </p>
                    <button
                      onClick={() => setShowCreateWallet(true)}
                      className="w-full bg-purple-500 text-white px-6 py-4 rounded-2xl font-bold hover:bg-purple-400 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      Create Chipi Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Create Wallet Modal */}
        {showCreateWallet && (
          <section className="bg-gradient-to-br from-purple-900/20 to-gray-900/50 border border-purple-500/30 rounded-3xl p-8 backdrop-blur-xl">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Create Your Chipi Wallet
                </h3>
                <p className="text-gray-400">
                  Set a secure encryption key to protect your wallet
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Encryption Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={encryptKey}
                    onChange={(e) => setEncryptKey(e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-gray-700 rounded-2xl text-white placeholder:text-gray-600 focus:border-purple-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={handleCreateChipiWallet}
                    disabled={isCreatingWallet || !encryptKey}
                    className="flex-1 bg-purple-500 text-white px-6 py-4 rounded-2xl font-bold hover:bg-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                  >
                    {isCreatingWallet ? "Creating Wallet..." : "Create Wallet"}
                  </button>

                  <button
                    onClick={() => {
                      setShowCreateWallet(false);
                      setEncryptKey("");
                    }}
                    className="px-8 py-4 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-2xl transition-all font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                <div className="flex gap-3">
                  <div className="text-yellow-400 text-xl">⚠️</div>
                  <div>
                    <p className="text-sm text-yellow-400 font-semibold mb-1">
                      Important Security Notice
                    </p>
                    <p className="text-xs text-gray-400">
                      Store your encryption key securely. It cannot be recovered
                      if lost and is required for all transactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Transfer Section */}
        {braavosConnected && chipiWallet && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Transfer Funds
              </h2>
              <p className="text-gray-400">Move assets between your wallets</p>
            </div>
            <BraavosToChipiTransfer
              braavosAddress={braavosAddress}
              chipiPublicKey={chipiWallet?.publicKey || ""}
              onTransferComplete={() => refetch()}
            />
          </section>
        )}

        {/* Actions Section */}
        {chipiWallet && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Wallet Actions
              </h2>
              <p className="text-gray-400">
                Make payments and view your activity
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <ChipiPayment
                userId={userId}
                bearerToken={bearerToken || ""}
                chipiWallet={chipiWallet}
              />
              <SecurityDashboard />
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="font-bold text-white mb-2">Gasless Transactions</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Send tokens without worrying about gas fees with Chipi Pay
              integration
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all group">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="font-bold text-white mb-2">Bank-Grade Security</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your wallet is encrypted and secured with industry-standard
              encryption
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all group">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Network className="w-6 h-6 text-orange-400" />
            </div>
            <h4 className="font-bold text-white mb-2">Multi-Wallet Support</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Seamlessly manage both Braavos and Chipi wallets in one dashboard
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

// Type declaration for Braavos wallet
declare global {
  interface Window {
    starknet_braavos?: {
      enable: () => Promise<string[]>;
      account: {
        execute: (calls: any[]) => Promise<any>;
      };
    };
  }
}
