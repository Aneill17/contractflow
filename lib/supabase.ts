import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client — uses anon key, respects RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client — uses service role key, bypasses RLS (for API routes only)
// NEVER expose this client to the browser
export const createServerClient = () =>
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

// Auth client — for reading session cookies in API routes
export const createAuthClient = (accessToken: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  })
