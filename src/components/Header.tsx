"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Wallet, CheckCircle, Shield } from "lucide-react";

export default function Header() {
  const [braavosConnected, setBraavosConnected] = useState(false);
  const [braavosAddress, setBraavosAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if Braavos is already connected on mount
    checkBraavosConnection();
  }, []);

  const checkBraavosConnection = async () => {
    if (typeof window !== "undefined" && (window as any).starknet_braavos) {
      try {
        const braavos = (window as any).starknet_braavos;
        // Check if already connected
        if (braavos.isConnected && braavos.selectedAddress) {
          setBraavosAddress(braavos.selectedAddress);
          setBraavosConnected(true);
        }
      } catch (err) {
        // Not connected yet
        console.log("Braavos not yet connected");
      }
    }
  };

  const connectBraavos = async () => {
    if (typeof window !== "undefined" && (window as any).starknet_braavos) {
      try {
        setIsConnecting(true);
        const braavos = (window as any).starknet_braavos;
        const result = await braavos.enable({ starknetVersion: "v5" });
        const address = Array.isArray(result) ? result[0] : result;
        
        setBraavosAddress(address);
        setBraavosConnected(true);
        
        // Show success message
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

  return (
    <header className="flex justify-between items-center px-8 lg:px-16 py-6">
      {/* Left: App Name */}
      <div className="flex items-center gap-2">
        <Shield className="w-8 h-8 text-emerald-400" />
        <a href="/" className="text-2xl font-bold text-white hover:opacity-90">Nimbus</a>
        {/* Dashboard Link - visible to all users */}
        <a
          href="/dashboard"
          className="ml-4 text-sm font-medium text-gray-300 hover:text-emerald-400 transition"
        >
          Dashboard
        </a>
      </div>
      
      {/* Right: Dashboard link, Braavos Connect + Auth Buttons */}
      <div className="flex items-center gap-4">
        {/* Prominent Dashboard link for quick access */}
        <Link
          href="/dashboard"
          className="hidden sm:inline-block bg-emerald-500 text-gray-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-emerald-400 transition"
        >
          Dashboard
        </Link>
        {/* Braavos Connect Status */}
        {braavosConnected ? (
          <div className="flex items-center gap-2 bg-green-600/20 border border-green-500/30 rounded-full px-4 py-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <Wallet className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">
              Connected: {braavosAddress?.slice(0, 6)}...{braavosAddress?.slice(-4)}
            </span>
          </div>
        ) : (
          <button
            onClick={connectBraavos}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-gray-900 rounded-full px-5 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Connect Braavos"}
          </button>
        )}

        {/* Clerk Auth Buttons */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-white hover:text-gray-300 text-sm font-medium transition">
              Login
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium text-sm px-5 py-2 transition">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10"
              }
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}
