"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Shield, Users, Globe, Wallet, CreditCard } from "lucide-react";
import { useCreateWallet, useGetWallet } from "@chipi-stack/nextjs";
import { useUser, useAuth } from "@clerk/nextjs";
import LaserFlow from "@/components/LaserFlow";
import { useBraavosBalance } from "@/hooks/useBraavosBalance";
import { useVaultBalance } from "@/hooks/useVaultBalance";
import TransactionPanel from "@/components/TransactionPanel";
import WalletDashboard from "@/components/WalletDashboard";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [walletDetected, setWalletDetected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [bearerToken, setBearerToken] = useState<string | null>(null);
  const [chipiWallet, setChipiWallet] = useState<any>(null);
  const [encryptKey, setEncryptKey] = useState("");
  const [showChipiSetup, setShowChipiSetup] = useState(false);
  const revealImgRef = useRef<HTMLDivElement>(null);

  const { createWalletAsync, isLoading: isCreatingWallet } = useCreateWallet();
  const { user } = useUser();
  const { getToken } = useAuth();
  
  // Fetch wallet balances
  const { balanceHuman: braavosBalance, loading: braavosLoading } = useBraavosBalance();
  const { balanceHuman: vaultBalance, loading: vaultLoading } = useVaultBalance({ address });

  const { data: walletData, refetch: refetchWallet } = useGetWallet({
    params: { externalUserId: userId || "" },
    getBearerToken: async () => {
      if (bearerToken) return bearerToken;
      const token = await getToken();
      setBearerToken(token || null);
      return token || "";
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.starknet_braavos) {
      setWalletDetected(true);
      
      // Check if Braavos is already connected
      const checkConnection = async () => {
        try {
          const braavos = (window as any).starknet_braavos;
          // Try to get address without prompting
          if (braavos.account?.address) {
            setAddress(braavos.account.address);
            setIsConnected(true);
            console.log("✅ Braavos already connected:", braavos.account.address);
          }
        } catch (err) {
          console.log("Braavos not connected yet");
        }
      };
      checkConnection();
      
      // Poll for connection status every 2 seconds
      const interval = setInterval(() => {
        try {
          const braavos = (window as any).starknet_braavos;
          if (braavos?.account?.address && !isConnected) {
            setAddress(braavos.account.address);
            setIsConnected(true);
            console.log("✅ Braavos connected:", braavos.account.address);
          }
        } catch (err) {
          // ignore
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }

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
  }, [user, getToken, isConnected]);

  useEffect(() => {
    if (walletData) {
      setChipiWallet(walletData);
    }
  }, [walletData]);

  // Debug: Log when dashboard conditions change
  useEffect(() => {
    console.log("📊 Dashboard Status:", {
      user: !!user,
      userId: user?.id,
      isConnected,
      address,
      showDashboard: !!(user && isConnected)
    });
  }, [user, isConnected, address]);

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const connectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.starknet_braavos) {
        alert("Please install Braavos wallet extension");
        window.open("https://braavos.app/download-braavos-wallet/", "_blank");
        return;
      }

      const [userAddress] = await window.starknet_braavos.enable();

      if (userAddress) {
        setAddress(userAddress);
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress("");
  };

  const handleCreateChipiWallet = async () => {
    if (!encryptKey || encryptKey.length < 8) {
      alert("Please enter an encryption key (minimum 8 characters)");
      return;
    }

    if (!userId || !bearerToken) {
      alert("Please sign in to your account first");
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

      console.log("Chipi Wallet created:", response);
      setChipiWallet(response.wallet);
      setShowChipiSetup(false);
      setEncryptKey("");
      alert("Chipi Wallet created successfully!");
      refetchWallet();
    } catch (error: any) {
      console.error("Error creating Chipi wallet:", error);
      alert(error.message || "Failed to create Chipi wallet");
    }
  };

  const depositToVault = async () => {
    try {
      if (!window.starknet_braavos || !isConnected || !address) {
        alert("Please connect your Braavos wallet first.");
        return;
      }

      const braavos = window.starknet_braavos;
      const vaultContractAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;

      if (!vaultContractAddress) {
        alert("Vault contract address is not configured.");
        return;
      }

      // Example transaction call to the vault contract
      const transaction = {
        contractAddress: vaultContractAddress,
        entrypoint: "deposit",
        calldata: [], // Add calldata if required by the contract
      };

      await braavos.account.execute([transaction]);
      alert("Transaction sent to the vault successfully!");
    } catch (error) {
      console.error("Failed to send transaction:", error);
      alert("Failed to send transaction. Please try again.");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const el = revealImgRef.current;
    if (el) {
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    }
  };

  const handleMouseLeave = () => {
    const el = revealImgRef.current;
    if (el) {
      el.style.setProperty("--mx", "-9999px");
      el.style.setProperty("--my", "-9999px");
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* LaserFlow Background */}
      <div className="absolute inset-0 z-0 bg-black">
        <LaserFlow
          horizontalBeamOffset={0.1}
          verticalBeamOffset={0.0}
          color="#10b981"
        />
      </div>

      {/* Background Image with Interactive Reveal */}
      <img
        src="/background.webp"
        alt="Background"
        style={
          {
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            top: 0,
            left: 0,
            zIndex: 1,
            opacity: 0.09,
            pointerEvents: "none",
          } as React.CSSProperties
        }
      />

      {/* Interactive White Glow Effect */}
      <div
        ref={revealImgRef}
        style={
          {
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            zIndex: 2,
            pointerEvents: "none",
            "--mx": "-9999px",
            "--my": "-9999px",
            background:
              "radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.2) 100px, rgba(255,255,255,0.1) 200px, rgba(255,255,255,0.05) 300px, rgba(255,255,255,0) 400px)",
          } as React.CSSProperties
        }
      />

      {/* Content Overlay */}
      <div className="relative z-10">
        <main className="px-8 lg:px-16 py-12 lg:py-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white">
                Your smart solution for{" "}
                <span className="text-emerald-400">financial management!</span>
              </h1>

              <p className="text-gray-300 text-lg">
                Manage your budget, savings, and investments easily, securely,
                and effectively with Braavos & Chipi Pay integration.
              </p>

              <div className="flex items-center gap-6 flex-wrap">
                {isConnected && userId && (
                  <button
                    onClick={() => setShowChipiSetup(!showChipiSetup)}
                    className="bg-purple-500 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-purple-400 transition-all flex items-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    {chipiWallet ? "Chipi Wallet Ready" : "Setup Chipi Pay"}
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
                    <div className="text-xl font-bold text-white">126K+</div>
                    <div className="text-sm text-gray-400">Customer review</div>
                  </div>
                </div>
              </div>

              {/* Chipi Wallet Setup Modal */}
              {showChipiSetup && !chipiWallet && (
                <div className="bg-gray-900/90 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-xl font-bold text-emerald-400">
                    Setup Chipi Wallet
                  </h3>
                  <p className="text-sm text-gray-400">
                    Create a gasless wallet for seamless transactions
                  </p>

                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Enter encryption key (min 8 characters)"
                      value={encryptKey}
                      onChange={(e) => setEncryptKey(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-emerald-400 focus:outline-none"
                    />

                    <button
                      onClick={handleCreateChipiWallet}
                      disabled={isCreatingWallet || !encryptKey}
                      className="w-full bg-emerald-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingWallet
                        ? "Creating Wallet..."
                        : "Create Chipi Wallet"}
                    </button>

                    <button
                      onClick={() => {
                        setShowChipiSetup(false);
                        setEncryptKey("");
                      }}
                      className="w-full text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-xs text-yellow-400">
                      <strong>Important:</strong> Store your encryption key
                      securely. You'll need it for transactions.
                    </p>
                  </div>
                </div>
              )}

              {/* Wallet Dashboard - show inline on homepage */}
              {user && isConnected ? (
                <WalletDashboard />
              ) : (
                user && !isConnected && (
                  <div className="mt-8 p-6 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
                    <p className="text-yellow-400">
                      👆 Please connect your Braavos wallet to view your dashboard
                    </p>
                  </div>
                )
              )}

              {/* Chipi Wallet Info */}
              {chipiWallet && (
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-purple-400">
                      Chipi Wallet Active
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Public Key:</span>
                      <span className="text-purple-400 font-mono">
                        {formatAddress(chipiWallet.publicKey)}
                      </span>
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
                <div className="bg-gray-900/40 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-md">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-400 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-4xl font-bold mb-1 text-white">
                    156K+
                  </div>
                  <div className="text-gray-400 text-sm">Users worldwide</div>
                </div>

                <div className="bg-gray-900/40 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-md">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-400 flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-4xl font-bold mb-1 text-white">145+</div>
                  <div className="text-gray-400 text-sm">Countries</div>
                </div>

                <div className="col-span-2 bg-gray-900/40 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-md">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-400 flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                  <div className="text-gray-300">
                    Take control of your finances with gasless transactions on
                    Starknet
                  </div>
                </div>
              </div>
            </div>

            <div className="relative lg:pl-12">
              <div className="relative w-full h-[600px] rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-gray-900/40 backdrop-blur-md shadow-2xl shadow-emerald-500/20">
                {/* Map Background */}
                <div className="absolute inset-0 opacity-40">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248849.886539092!2d77.49085284725782!3d12.953945613596583!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                      filter: "grayscale(100%) invert(100%)",
                    }}
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>

                {/* Overlay gradient for better visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>

                {/* Business markers */}
                <div className="absolute inset-0 z-10">
                  {/* Marker 1 */}
                  <div className="absolute top-[20%] left-[30%] group cursor-pointer">
                    <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-500/30">
                      <p className="text-xs text-emerald-400 font-semibold">
                        Chipi Café
                      </p>
                      <p className="text-xs text-gray-400">Coffee Shop</p>
                    </div>
                  </div>

                  {/* Marker 2 */}
                  <div className="absolute top-[45%] left-[60%] group cursor-pointer">
                    <div
                      className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-500/30">
                      <p className="text-xs text-emerald-400 font-semibold">
                        Tech Store
                      </p>
                      <p className="text-xs text-gray-400">Electronics</p>
                    </div>
                  </div>

                  {/* Marker 3 */}
                  <div className="absolute top-[65%] left-[25%] group cursor-pointer">
                    <div
                      className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"
                      style={{ animationDelay: "1s" }}
                    ></div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-500/30">
                      <p className="text-xs text-emerald-400 font-semibold">
                        Grocery Mart
                      </p>
                      <p className="text-xs text-gray-400">Supermarket</p>
                    </div>
                  </div>

                  {/* Marker 4 */}
                  <div className="absolute top-[30%] left-[70%] group cursor-pointer">
                    <div
                      className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"
                      style={{ animationDelay: "1.5s" }}
                    ></div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-500/30">
                      <p className="text-xs text-emerald-400 font-semibold">
                        Fashion Hub
                      </p>
                      <p className="text-xs text-gray-400">Clothing Store</p>
                    </div>
                  </div>

                  {/* Marker 5 */}
                  <div className="absolute top-[55%] left-[45%] group cursor-pointer">
                    <div
                      className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"
                      style={{ animationDelay: "2s" }}
                    ></div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-500/30">
                      <p className="text-xs text-emerald-400 font-semibold">
                        Fitness Center
                      </p>
                      <p className="text-xs text-gray-400">Gym</p>
                    </div>
                  </div>

                  {/* Marker 6 */}
                  <div className="absolute top-[75%] left-[55%] group cursor-pointer">
                    <div
                      className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"
                      style={{ animationDelay: "2.5s" }}
                    ></div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-500/30">
                      <p className="text-xs text-emerald-400 font-semibold">
                        Restaurant
                      </p>
                      <p className="text-xs text-gray-400">Dining</p>
                    </div>
                  </div>
                </div>

                {/* Map info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent p-6 z-20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-emerald-400 mb-1">
                        Chipi Pay Network
                      </h3>
                      <p className="text-sm text-gray-400">
                        6 businesses accepting gasless payments
                      </p>
                    </div>
                    <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold">
                      Live
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
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
