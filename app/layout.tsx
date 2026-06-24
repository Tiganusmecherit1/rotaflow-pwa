import type { Metadata, Viewport } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'RotaFlow',
  description: 'Tura ta, oriunde ești',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'RotaFlow' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1c1c1e',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body style={{ background: '#1c1c1e', color: 'white', WebkitTapHighlightColor: 'transparent', overscrollBehavior: 'none' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
