'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Users, Globe, Wallet, CreditCard } from 'lucide-react';
import { useCreateWallet, useGetWallet } from '@chipi-stack/nextjs';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [walletDetected, setWalletDetected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [bearerToken, setBearerToken] = useState<string | null>(null);
  const [chipiWallet, setChipiWallet] = useState<any>(null);
  const [encryptKey, setEncryptKey] = useState('');
  const [showChipiSetup, setShowChipiSetup] = useState(false);

  const { createWalletAsync, isLoading: isCreatingWallet } = useCreateWallet();
  const { data: walletData, refetch: refetchWallet } = useGetWallet({
    externalUserId: userId || '',
    bearerToken: bearerToken || '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.starknet_braavos) {
      setWalletDetected(true);
    }
    
    // Check if user is already logged in to Supabase
    checkSupabaseSession();
  }, []);

  useEffect(() => {
    if (walletData) {
      setChipiWallet(walletData);
    }
  }, [walletData]);

  const checkSupabaseSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      setBearerToken(session.access_token);
      // Automatically fetch wallet if session exists
      refetchWallet();
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const connectWallet = async () => {
    try {
      if (typeof window === 'undefined' || !window.starknet_braavos) {
        alert('Please install Braavos wallet extension');
        window.open('https://braavos.app/download-braavos-wallet/', '_blank');
        return;
      }

      const [userAddress] = await window.starknet_braavos.enable();

      if (userAddress) {
        setAddress(userAddress);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress('');
  };

  const handleCreateChipiWallet = async () => {
    if (!encryptKey || encryptKey.length < 8) {
      alert('Please enter an encryption key (minimum 8 characters)');
      return;
    }

    if (!userId || !bearerToken) {
      alert('Please sign in to your account first');
      return;
    }

    try {
      const response = await createWalletAsync({
        params: {
          encryptKey,
          externalUserId: userId,
        },
        bearerToken,
      });

      console.log('Chipi Wallet created:', response);
      setChipiWallet(response.wallet);
      setShowChipiSetup(false);
      setEncryptKey(''); // Clear encryption key after success
      alert('Chipi Wallet created successfully!');
      refetchWallet();
    } catch (error: any) {
      console.error('Error creating Chipi wallet:', error);
      alert(error.message || 'Failed to create Chipi wallet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 text-white">
      <header className="flex justify-between items-center px-8 lg:px-16 py-6">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-emerald-400" />
          <span className="text-2xl font-bold">Fiflow</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm">
          <a href="#" className="text-emerald-400 underline underline-offset-4">Home</a>
          <a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors">Features</a>
          <a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors">Company</a>
          <a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors">About Us</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/auth?mode=login">
            <button className="text-sm text-gray-300 hover:text-emerald-400 transition-colors">Login</button>
          </Link>
          <Link href="/auth?mode=signup">
            <button className="bg-emerald-400 text-gray-900 px-6 py-2 rounded-full text-sm font-semibold hover:bg-emerald-300 transition-colors">
              Sign Up
            </button>
          </Link>
        </div>
      </header>

      <main className="px-8 lg:px-16 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Your smart solution for <span className="text-emerald-400">financial management!</span>
            </h1>

            <p className="text-gray-400 text-lg">
              Manage your budget, savings, and investments easily, securely, and effectively with Braavos & Chipi Pay integration.
            </p>

            <div className="flex items-center gap-6 flex-wrap">
              <button
                onClick={connectWallet}
                className="bg-emerald-400 text-gray-900 px-8 py-3 rounded-full text-base font-semibold hover:bg-emerald-300 transition-all flex items-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                {walletDetected ? 'Connect Braavos' : 'Install Braavos Wallet'}
              </button>

              {isConnected && userId && (
                <button
                  onClick={() => setShowChipiSetup(!showChipiSetup)}
                  className="bg-purple-500 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-purple-400 transition-all flex items-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {chipiWallet ? 'Chipi Wallet Ready' : 'Setup Chipi Pay'}
                </button>
              )}

              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-gray-900"></div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-gray-900"></div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-gray-900"></div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-gray-900"></div>
                </div>
                <div>
                  <div className="text-xl font-bold">126K+</div>
                  <div className="text-sm text-gray-400">Customer review</div>
                </div>
              </div>
            </div>

            {/* Chipi Wallet Setup Modal */}
            {showChipiSetup && !chipiWallet && (
              <div className="bg-gray-800/90 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <h3 className="text-xl font-bold text-emerald-400">Setup Chipi Wallet</h3>
                <p className="text-sm text-gray-400">Create a gasless wallet for seamless transactions</p>
                
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter encryption key (min 8 characters)"
                    value={encryptKey}
                    onChange={(e) => setEncryptKey(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-emerald-400 focus:outline-none"
                  />
                  
                  <button
                    onClick={handleCreateChipiWallet}
                    disabled={isCreatingWallet || !encryptKey}
                    className="w-full bg-emerald-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingWallet ? 'Creating Wallet...' : 'Create Chipi Wallet'}
                  </button>

                  <button
                    onClick={() => {
                      setShowChipiSetup(false);
                      setEncryptKey('');
                    }}
                    className="w-full text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-400">
                    <strong>Important:</strong> Store your encryption key securely. You'll need it for transactions.
                  </p>
                </div>
              </div>
            )}

            {/* Chipi Wallet Info */}
            {chipiWallet && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-purple-400">Chipi Wallet Active</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Public Key:</span>
                    <span className="text-purple-400 font-mono">{formatAddress(chipiWallet.publicKey)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-emerald-400">Starknet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Ready
                    </span>
                  </div>
                </div>
                <Link href="/dashboard">
                  <button className="w-full mt-2 bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-400 transition-colors">
                    Go to Dashboard
                  </button>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-3xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-400 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-4xl font-bold mb-1">156K+</div>
                <div className="text-gray-400 text-sm">Users worldwide</div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-3xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-400 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-4xl font-bold mb-1">145+</div>
                <div className="text-gray-400 text-sm">Countries</div>
              </div>

              <div className="col-span-2 bg-emerald-950/30 border border-emerald-900/50 rounded-3xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-400 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div className="text-gray-300">
                  Take control of your finances with gasless transactions on Starknet
                </div>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-12">
            <div className="relative mx-auto w-80 h-[640px]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[3rem] shadow-2xl shadow-emerald-500/50 border-8 border-gray-900">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl"></div>

                <div className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-900 font-semibold">9:25</div>
                    <div className="flex gap-1">
                      <div className="w-4 h-3 bg-gray-900/20 rounded-sm"></div>
                      <div className="w-4 h-3 bg-gray-900/20 rounded-sm"></div>
                      <div className="w-4 h-3 bg-gray-900/20 rounded-sm"></div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">
                      Your smart solution for financial management!
                    </h2>

                    <div className="relative w-48 h-48 mx-auto mb-8">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-full transform rotate-12"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-gray-100 to-gray-300 rounded-full"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl">💰</div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-900/80 text-center px-4">
                      Gasless payments powered by Chipi Pay & Braavos on Starknet
                    </p>
                  </div>

                  {(isConnected || chipiWallet) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-lg p-4 rounded-t-3xl">
                      <div className="space-y-2">
                        {isConnected && (
                          <>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">Braavos</span>
                              <span className="text-emerald-400 font-mono">{formatAddress(address)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">Status</span>
                              <span className="text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                Connected
                              </span>
                            </div>
                          </>
                        )}
                        
                        {chipiWallet && (
                          <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-700">
                            <span className="text-gray-400">Chipi Wallet</span>
                            <span className="text-purple-400 font-mono">{formatAddress(chipiWallet.publicKey)}</span>
                          </div>
                        )}

                        {isConnected && (
                          <button
                            onClick={disconnectWallet}
                            className="w-full mt-2 bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
    };
  }
}