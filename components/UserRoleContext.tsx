'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

type Role = 'owner' | 'staff' | null

interface RoleContextValue {
  role: Role
  userId: string | null
  userName: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  userId: null,
  userName: null,
  loading: true,
  signOut: async () => {},
})

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      setUserId(session.user.id)

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, name')
        .eq('id', session.user.id)
        .single()

      setRole((profile?.role as Role) ?? 'staff')
      setUserName(profile?.name ?? session.user.email ?? null)
      setLoading(false)
    }

    loadRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadRole()
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <RoleContext.Provider value={{ role, userId, userName, loading, signOut }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
