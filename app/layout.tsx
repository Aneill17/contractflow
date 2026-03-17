import type { Metadata } from 'next'
import './globals.css'
import { UserRoleProvider } from '@/components/UserRoleContext'

export const metadata: Metadata = {
  title: 'Elias Range Stays — Housing Portal',
  description: 'Corporate Housing Contract Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;600;700&family=Source+Serif+4:ital,wght@0,400;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <UserRoleProvider>{children}</UserRoleProvider>
      </body>
    </html>
  )
}
