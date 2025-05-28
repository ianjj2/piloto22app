import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Piloto Aviator APP',
  description: 'Piloto Aviator APP',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
} 