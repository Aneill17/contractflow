import type { Metadata } from 'next'
import './globals.css'
import { UserRoleProvider } from '@/components/UserRoleContext'

export const metadata: Metadata = {
  title: 'ContractFlow',
  description: 'Corporate Housing Contract Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <UserRoleProvider>{children}</UserRoleProvider>
      </body>
    </html>
  )
}
