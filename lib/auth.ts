import { createServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export type UserRole = 'owner' | 'staff'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string
}

// Get authenticated user + role from request (for API routes)
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  // Get role from user_profiles
  const serverClient = createServerClient()
  const { data: profile } = await serverClient
    .from('user_profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: (profile?.role as UserRole) ?? 'staff',
    name: profile?.name ?? user.email!,
  }
}

// Strip financial fields from contract for staff role
export function stripFinancials(contract: Record<string, unknown>) {
  const stripped = { ...contract }
  const financialFields = [
    'price_per_unit',
    'damage_deposit',
    'payment_due',
    'payment_method',
    'quote_line_items',
    'generated_contract',
  ]
  for (const field of financialFields) {
    stripped[field] = null
  }
  return stripped
}
