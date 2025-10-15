import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserType = 'individual' | 'business'

export interface AuthUser {
  id: string
  email: string
  userType: UserType
  metadata?: {
    businessName?: string
    fullName?: string
  }
}