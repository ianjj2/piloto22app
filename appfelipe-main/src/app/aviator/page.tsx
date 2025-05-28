'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import FirstVisitModal from '@/components/FirstVisitModal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useQuery } from '@tanstack/react-query'
import { FloatingClock } from '@/components/FloatingClock'

const AVIATOR_URLS = {
  DEFAULT: 'https://copapix.io/casino/spribe/aviator',
  REGISTER: 'http://copapix.io/?ref=52NBYST4BX'
}

// Componente de Loading
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#0a0808] flex flex-col">
    <div className="bg-[#1a0808]/90 border-b border-red-800 backdrop-blur-sm py-2">
      <div className="max-w-7xl mx-auto px-3">
        <div className="flex items-center gap-2 w-full">
          {/* Entrada Sugerida Skeleton */}
          <div className="flex-1 bg-[#1a0808] p-2 rounded-lg border border-blue-800/50 animate-pulse">
            <div className="text-center space-y-2">
              <div className="h-4 bg-blue-500/20 rounded w-24 mx-auto"></div>
              <div className="h-6 bg-blue-500/20 rounded w-16 mx-auto"></div>
            </div>
          </div>

          {/* Stop Gain Skeleton */}
          <div className="flex-1 bg-[#1a0808] p-2 rounded-lg border border-green-800/50 animate-pulse">
            <div className="text-center space-y-2">
              <div className="h-4 bg-green-500/20 rounded w-24 mx-auto"></div>
              <div className="h-6 bg-green-500/20 rounded w-16 mx-auto"></div>
            </div>
          </div>

          {/* Stop Loss Skeleton */}
          <div className="flex-1 bg-[#1a0808] p-2 rounded-lg border border-red-800/50 animate-pulse">
            <div className="text-center space-y-2">
              <div className="h-4 bg-red-500/20 rounded w-24 mx-auto"></div>
              <div className="h-6 bg-red-500/20 rounded w-16 mx-auto"></div>
            </div>
          </div>

          {/* Botão Editar Skeleton */}
          <div className="w-16 h-12 bg-[#1a0808] rounded-lg border border-red-800/50 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
)

export default function AviatorGame() {
  const [showFirstVisit, setShowFirstVisit] = useState(false)
  const [aviatorUrl, setAviatorUrl] = useState<string | null>(null)
  const [showIframe, setShowIframe] = useState(false)
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<any>(null);

  // Busca as configurações da calculadora usando React Query
  const { data: calculatorSettings, isLoading } = useQuery({
    queryKey: ['calculatorSettings'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const { data, error } = await supabase
        .from('calculator_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      console.log('Dados da calculadora:', data) // Log para debug

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar dados:', error) // Log para debug
        throw error
      }

      return data
    },
    staleTime: 60000 // 1 minuto
  })

  // Efeito para verificar primeira visita usando localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVisited = localStorage.getItem('hasVisitedAviator')
      if (hasVisited) {
        setShowFirstVisit(false)
        setAviatorUrl(AVIATOR_URLS.DEFAULT)
        setShowIframe(true)
      } else {
        setShowFirstVisit(true)
      }
    }
  }, [])

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  useEffect(() => {
    if (!session) return;

    // Função para chamar a função do banco
    const claimPresencePoints = async () => {
      const { error } = await supabase.rpc('register_aviator_presence_points', {
        user_id_param: session.user.id
      });
      if (error) {
        console.error('Erro ao registrar pontos de presença:', error);
      }
    };

    // Chama a cada 2 minutos (120000 ms)
    const interval = setInterval(claimPresencePoints, 120000);

    // Chama uma vez ao entrar na página
    claimPresencePoints();

    // Limpa o intervalo ao sair da página
    return () => clearInterval(interval);
  }, [session]);

  const handleFirstVisitChoice = (hasAccount: boolean) => {
    const url = hasAccount ? AVIATOR_URLS.DEFAULT : AVIATOR_URLS.REGISTER
    setAviatorUrl(url)
    setShowIframe(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasVisitedAviator', 'true')
    }
    setShowFirstVisit(false)
  }

  // Log para debug
  console.log('Estado atual:', { calculatorSettings, isLoading, showIframe })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="bg-[#0f0f0f] text-white">
      <FloatingClock />
      {/* Calculadora sempre visível no topo */}
      <div className="sticky top-[4rem] left-0 right-0 z-40 bg-[#1a0808]/90 border-b border-red-800 backdrop-blur-sm py-2">
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center gap-2">
            {calculatorSettings && (
              <>
                {/* Entrada Sugerida */}
                <div className="flex-1 bg-[#1a0808] p-2 rounded-lg border border-blue-800">
                  <div className="text-center">
                    <p className="text-blue-400 text-sm">Entrada Sugerida</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-blue-500 text-sm mr-1">R$</span>
                      <span className="text-blue-500 text-xl font-bold">
                        {(calculatorSettings.banca * 0.01).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stop Gain */}
                <div className="flex-1 bg-[#1a0808] p-2 rounded-lg border border-green-800">
                  <div className="text-center">
                    <p className="text-green-400 text-sm">Stop Gain</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-green-500 text-sm mr-1">R$</span>
                      <span className="text-green-500 text-xl font-bold">
                        {calculatorSettings.stop_gain_value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stop Loss */}
                <div className="flex-1 bg-[#1a0808] p-2 rounded-lg border border-red-800">
                  <div className="text-center">
                    <p className="text-red-400 text-sm">Stop Loss</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-red-500 text-sm mr-1">R$</span>
                      <span className="text-red-500 text-xl font-bold">
                        {calculatorSettings.stop_loss_value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botão Editar */}
                <button
                  onClick={() => window.location.href = '/calculadora'}
                  className="bg-[#1a0808] px-3 py-2 rounded-lg border border-red-800/50 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                >
                  Editar<br/>Stops
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="h-[calc(100vh-8rem)] bg-[#0a0808]">
        {/* Área principal com o iframe */}
        <div className="h-full relative">
          {showFirstVisit && (
            <FirstVisitModal 
              isOpen={showFirstVisit}
              onChoice={handleFirstVisitChoice} 
            />
          )}

          {showIframe && aviatorUrl && (
            <iframe
              src={aviatorUrl}
              className="w-full h-full absolute inset-0 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>
      </div>
    </div>
  )
} 
