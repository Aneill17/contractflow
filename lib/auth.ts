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
// AUTH TEMPORARILY BYPASSED — returns mock owner user
export async function getAuthUser(_req: NextRequest): Promise<AuthUser | null> {
  return {
    id: 'bypass',
    email: 'austin@eliasrangestays.ca',
    role: 'owner',
    name: 'Austin Neill',
  }
}

// Client-side helper: get auth headers from supabase session
// Import supabase browser client to avoid circular deps
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {}
  try {
    const { createBrowserClient } = await import('@supabase/ssr')
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { session } } = await sb.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  } catch { return {} }
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
