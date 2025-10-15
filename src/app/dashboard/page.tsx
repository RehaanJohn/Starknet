"use client";

import React, { useState, useEffect } from "react";
import { Shield, Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, RefreshCw, Copy, Check } from "lucide-react";
import { useGetWallet, useCreateWallet } from "@chipi-stack/nextjs";
import ChipiPayment from "@/components/ChipiPayment";
import SecurityDashboard from '@/components/SecurityDashboard';
import BraavosToChipiTransfer from '@/components/BraavosToChipiTransfer';
import { useUser, useAuth } from "@clerk/nextjs";

export default function WalletDashboard() {
  const [braavosConnected, setBraavosConnected] = useState(false);
  const [braavosAddress, setBraavosAddress] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [bearerToken, setBearerToken] = useState<string | null>(null);
  const { user } = useUser();
  const { getToken } = useAuth();
  const [encryptKey, setEncryptKey] = useState('');
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [copied, setCopied] = useState<string>('');

  const { data: chipiWallet, isLoading: isLoadingWallet, refetch } = useGetWallet({
    params: { externalUserId: userId || '' },
    getBearerToken: async () => {
      if (bearerToken) return bearerToken;
      const token = await getToken();
      setBearerToken(token || null);
      return token || '';
    }
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
    if (typeof window !== 'undefined' && window.starknet_braavos) {
      try {
        const [address] = await window.starknet_braavos.enable();
        if (address) {
          setBraavosAddress(address);
          setBraavosConnected(true);
        }
      } catch (error) {
        console.log('Braavos not connected');
      }
    }
  };

  const connectBraavos = async () => {
    if (typeof window === 'undefined' || !window.starknet_braavos) {
      alert('Please install Braavos wallet extension');
      window.open('https://braavos.app/download-braavos-wallet/', '_blank');
      return;
    }

    try {
      const [address] = await window.starknet_braavos.enable();
      if (address) {
        setBraavosAddress(address);
        setBraavosConnected(true);
      }
    } catch (error) {
      console.error('Failed to connect Braavos:', error);
      alert('Failed to connect Braavos wallet');
    }
  };

  const handleCreateChipiWallet = async () => {
    if (!encryptKey || encryptKey.length < 8) {
      alert('Please enter an encryption key (minimum 8 characters)');
      return;
    }

    if (!userId || !bearerToken) {
      alert('Please sign in first');
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
      setEncryptKey('');
      refetch();
      alert('Chipi Wallet created successfully!');
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      alert(error.message || 'Failed to create Chipi wallet');
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
          <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please sign in to access your wallet dashboard</p>
          <a href="/auth?mode=login" className="inline-block bg-emerald-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400 transition-all">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold">Fiflow Wallet</span>
          </div>
          <a href="/" className="text-gray-400 hover:text-emerald-400 transition-colors">
            Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Wallet Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Braavos Wallet Card */}
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-bold">Braavos Wallet</h3>
              </div>
              {braavosConnected && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Connected
                </span>
              )}
            </div>

            {braavosConnected ? (
              <div className="space-y-3">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Address</p>
                  <div className="flex items-center justify-between">
                    <p className="text-orange-400 font-mono text-sm">{formatAddress(braavosAddress)}</p>
                    <button
                      onClick={() => copyToClipboard(braavosAddress, 'braavos')}
                      className="text-gray-400 hover:text-orange-400 transition-colors"
                    >
                      {copied === 'braavos' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Your Braavos wallet is connected and ready for standard Starknet transactions
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">
                  Connect your Braavos wallet to interact with Starknet
                </p>
                <button
                  onClick={connectBraavos}
                  className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-400 transition-all"
                >
                  Connect Braavos
                </button>
              </div>
            )}
          </div>

          {/* Braavos -> Chipi Transfer */}
          <div className="md:col-span-2">
            <BraavosToChipiTransfer
              braavosAddress={braavosAddress}
              chipiPublicKey={chipiWallet?.publicKey || ''}
              onTransferComplete={() => refetch()}
            />
          </div>

          {/* Chipi Wallet Card */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold">Chipi Wallet</h3>
              </div>
              {chipiWallet && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Active
                </span>
              )}
            </div>

            {isLoadingWallet ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            ) : chipiWallet ? (
              <div className="space-y-3">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Public Key</p>
                  <div className="flex items-center justify-between">
                    <p className="text-purple-400 font-mono text-sm">{formatAddress(chipiWallet.publicKey)}</p>
                    <button
                      onClick={() => copyToClipboard(chipiWallet.publicKey, 'chipi')}
                      className="text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {copied === 'chipi' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-3">
                  <p className="text-xs text-emerald-400 font-semibold">⚡ Gasless Transactions Enabled</p>
                  <p className="text-xs text-gray-400 mt-1">Send payments without paying gas fees</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">
                  Create a Chipi wallet for gasless transactions on Starknet
                </p>
                <button
                  onClick={() => setShowCreateWallet(true)}
                  className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-400 transition-all"
                >
                  Create Chipi Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Wallet Modal */}
        {showCreateWallet && (
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-purple-400">Create Chipi Wallet</h3>
            <p className="text-sm text-gray-400">
              Set an encryption key to secure your wallet. Keep this key safe - you'll need it to sign transactions.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Encryption Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter encryption key (min 8 characters)"
                  value={encryptKey}
                  onChange={(e) => setEncryptKey(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCreateChipiWallet}
                  disabled={isCreatingWallet || !encryptKey}
                  className="flex-1 bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingWallet ? 'Creating...' : 'Create Wallet'}
                </button>

                <button
                  onClick={() => {
                    setShowCreateWallet(false);
                    setEncryptKey('');
                  }}
                  className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-400">
                <strong>Important:</strong> Store your encryption key securely. It cannot be recovered if lost.
              </p>
            </div>
          </div>
        )}

        {/* Payment Section */}
        {chipiWallet && (
          <div className="grid lg:grid-cols-2 gap-6">
            <ChipiPayment 
              userId={userId}
              bearerToken={bearerToken || ''}
              chipiWallet={chipiWallet}
            />

            {/* Transaction History Placeholder */}
            <SecurityDashboard />
          </div>
        )}

        {/* Features Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              <h4 className="font-semibold">Gasless Sends</h4>
            </div>
            <p className="text-xs text-gray-400">
              Send tokens without worrying about gas fees with Chipi Pay
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold">Secure</h4>
            </div>
            <p className="text-xs text-gray-400">
              Your wallet is encrypted and secured with your private key
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-orange-400" />
              <h4 className="font-semibold">Multi-Wallet</h4>
            </div>
            <p className="text-xs text-gray-400">
              Use both Braavos and Chipi wallets seamlessly in one place
            </p>
          </div>
        </div>
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