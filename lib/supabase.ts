import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Hardcoded fallbacks to ensure connectivity regardless of env var typos
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dfcsqpgltjlbzdwxughu.supabase.co').replace(/^it/, '').replace(/\/$/, '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmY3NxcGdsdGpsYnpkd3h1Z2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzUzNDcsImV4cCI6MjA4ODI1MTM0N30.Riv_PCMJ9BoBqkMlhCpMH8oFNqHRCr7K-7TRqS3FH7A'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmY3NxcGdsdGpsYnpkd3h1Z2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY3NTM0NywiZXhwIjoyMDg4MjUxMzQ3fQ.d7e-93PlISVrieMRM5rgVEp-Qzrp7Y39XrwQz4LgDpg'

// Browser client — uses @supabase/ssr so session is stored in cookies (not localStorage)
// This is required for Next.js middleware to see the session
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server client — uses service role key, bypasses RLS (for API routes only)
// NEVER expose this to the browser
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
