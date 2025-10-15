"use client";

import { useEffect, useState, useCallback } from 'react';
import { useWalletSecurity } from './useWalletSecurity';

/**
 * useSessionSecurity
 * - Tracks user activity and enforces a session timeout
 * - Provides lock/unlock methods and a `locked` boolean for UI
 * - Integrates with useWalletSecurity to freeze wallet on expiry if desired
 */

export function useSessionSecurity({ inactivityMinutes = 15 }: { inactivityMinutes?: number } = {}) {
  const [locked, setLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const { freezeWallet } = useWalletSecurity();

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (locked) setLocked(false);
  }, [locked]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'touchstart', 'click'];

    const update = () => resetActivity();
    events.forEach((ev) => window.addEventListener(ev, update));

    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      if (elapsed > inactivityMinutes * 60 * 1000) {
        // Lock session
        setLocked(true);
        // Optionally freeze wallet to be extra safe
        try { freezeWallet(); } catch (e) { /* ignore */ }
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, update));
      clearInterval(interval);
    };
  }, [lastActivity, inactivityMinutes, resetActivity, freezeWallet]);

  const unlock = useCallback(() => {
    resetActivity();
    setLocked(false);
  }, [resetActivity]);

  return { locked, lastActivity, resetActivity, unlock };
}
