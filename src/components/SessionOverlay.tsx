"use client";

import React from 'react';
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { SignInButton } from '@clerk/nextjs';

export default function SessionOverlay() {
  const { locked, unlock } = useSessionSecurity({ inactivityMinutes: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '15') });

  if (!locked) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center max-w-md w-full">
        <h3 className="text-lg font-bold text-white mb-2">Session Locked</h3>
        <p className="text-sm text-gray-400 mb-4">For your security, the session has been locked due to inactivity. Please sign in again to continue.</p>
        <div className="flex items-center justify-center gap-4">
          <SignInButton>
            <button className="inline-block bg-emerald-500 text-gray-900 px-6 py-3 rounded-lg font-semibold">Sign In</button>
          </SignInButton>
          <button
            onClick={unlock}
            className="px-4 py-2 text-sm text-gray-300 border border-gray-700 rounded hover:bg-gray-800"
          >
            Unlock (if active)
          </button>
        </div>
      </div>
    </div>
  );
}
