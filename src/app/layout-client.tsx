'use client';

import './globals.css'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import Navigation from '@/components/Navigation'
import SupabaseProvider from '@/contexts/SupabaseProvider'
import AviatorNotification from '@/components/AviatorNotification'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60000, // 1 minuto
        retry: 3,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SupabaseProvider>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen relative">
              {/* Fundo */}
              <Image
                src="/assets/Fundo.jpg"
                alt="Background"
                fill
                sizes="100vw"
                className="object-cover fixed inset-0 z-0"
                quality={100}
                priority
              />
              
              {/* Overlay escuro para melhorar legibilidade */}
              <div className="absolute inset-0 bg-black/50 z-10" />
              
              {/* Conteúdo */}
              <div className="relative z-20">
                <Navigation />
                <AviatorNotification />
                <Toaster richColors position="top-right" />
                {children}
              </div>
            </div>
          </QueryClientProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
} 