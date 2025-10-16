"use client";

import WalletDashboard from "@/components/WalletDashboard";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <>
      <SignedIn>
        <WalletDashboard />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
