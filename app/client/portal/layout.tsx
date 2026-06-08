import { ReactNode } from 'react'

// Minimal layout wrapper — auth is checked client-side in each page
export default function ClientPortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
