'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Shield, Users, Building2, Mail, Lock, User, ArrowRight } from 'lucide-react'

type AuthMode = 'login' | 'signup'
type UserType = 'individual' | 'business'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>('signup')
  const [userType, setUserType] = useState<UserType>('individual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    businessName: ''
  })

  // Set initial mode from URL parameter
  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'login' || modeParam === 'signup') {
      setMode(modeParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              user_type: userType,
              full_name: userType === 'individual' ? formData.fullName : undefined,
              business_name: userType === 'business' ? formData.businessName : undefined
            }
          }
        })

        if (error) throw error
        
        if (data.user) {
          alert('Sign up successful! Please check your email to verify your account.')
          router.push('/dashboard')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) throw error
        
        if (data.user) {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-6">
          <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
            <Shield className="w-10 h-10 text-emerald-400" />
            <span className="text-3xl font-bold">Fiflow</span>
          </Link>
          
          <h1 className="text-5xl font-bold leading-tight">
            Your smart solution for <span className="text-emerald-400">financial management!</span>
          </h1>
          
          <p className="text-gray-400 text-lg">
            Manage your budget, savings, and investments easily, securely, and effectively.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4">
              <div className="text-3xl font-bold mb-1">156K+</div>
              <div className="text-gray-400 text-sm">Users worldwide</div>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4">
              <div className="text-3xl font-bold mb-1">145+</div>
              <div className="text-gray-400 text-sm">Countries</div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-emerald-900/30 rounded-3xl p-8 lg:p-10">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-8 bg-gray-800/50 rounded-full p-1">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-emerald-400 text-gray-900' : 'text-gray-400'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-emerald-400 text-gray-900' : 'text-gray-400'
              }`}
            >
              Login
            </button>
          </div>

          {/* User Type Selection (only for signup) */}
          {mode === 'signup' && (
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3 text-gray-300">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('individual')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    userType === 'individual'
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Users className="w-6 h-6 text-emerald-400" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Individual</div>
                    <div className="text-xs text-gray-400">Personal account</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('business')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    userType === 'business'
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Building2 className="w-6 h-6 text-emerald-400" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Business</div>
                    <div className="text-xs text-gray-400">Company account</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-5">
            {mode === 'signup' && userType === 'individual' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:border-emerald-400 focus:outline-none transition-colors text-white placeholder-gray-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && userType === 'business' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Business Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:border-emerald-400 focus:outline-none transition-colors text-white placeholder-gray-500"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:border-emerald-400 focus:outline-none transition-colors text-white placeholder-gray-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:border-emerald-400 focus:outline-none transition-colors text-white placeholder-gray-500"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-emerald-400 text-gray-900 py-3.5 rounded-xl font-semibold hover:bg-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {mode === 'login' && (
            <div className="mt-6 text-center">
              <button className="text-sm text-emerald-400 hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}