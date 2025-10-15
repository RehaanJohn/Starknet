"use client"

import React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, Users, Building2, Mail, Lock, User, ArrowRight } from "lucide-react"
import { SignIn } from "@clerk/nextjs"

export default function AuthPage() {
  // Redirect to Clerk's prebuilt sign in/up UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-6">
          <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
            <Shield className="w-10 h-10 text-emerald-400" />
            <span className="text-3xl font-bold">Fiflow</span>
          </Link>
          <h1 className="text-5xl font-bold leading-tight">
            Your smart solution for <span className="text-emerald-400">financial management!</span>
          </h1>
          <p className="text-gray-400 text-lg">Use Clerk to sign in or sign up for access.</p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-emerald-900/30 rounded-3xl p-8 lg:p-10">
          <SignIn routing="path" path="/auth" />
        </div>
      </div>
    </div>
  )
}