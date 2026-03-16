'use client'

import { ReactNode } from 'react'
import { useRole } from '@/components/UserRoleContext'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

// Renders children ONLY for owner role.
// Staff users see nothing (or optional fallback).
// This is UI layer — financial fields are ALSO stripped server-side.
export default function OwnerOnly({ children, fallback = null }: Props) {
  const { role, loading } = useRole()
  if (loading || role !== 'owner') return <>{fallback}</>
  return <>{children}</>
}
