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
  themeColor: '#1a1a1f',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      </head>
      <body style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI Variable', sans-serif",
        background: '#1a1a1f',
        color: 'white',
        WebkitTapHighlightColor: 'transparent',
        overscrollBehavior: 'none',
        margin: 0,
      }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
