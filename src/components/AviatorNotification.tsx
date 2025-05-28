'use client'

import { useEffect, useRef } from 'react'
import { useSupabase } from '@/contexts/SupabaseProvider'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  message: string
  type: 'signal' | 'alert' | 'info'
  created_at: string
  expires_at: string
  active: boolean
}

export default function AviatorNotification() {
  const { supabase } = useSupabase()
  const lastNotificationId = useRef<string | null>(null)

  useEffect(() => {
    // Função para mostrar o toast
    const showToast = (notification: Notification) => {
      // Verifica se já mostrou esta notificação antes (mesmo após recarregar a página)
      const lastShownId = localStorage.getItem('lastShownNotificationId')
      if (lastShownId === notification.id || lastNotificationId.current === notification.id) {
        return
      }
      
      // Salva o ID da notificação tanto no ref quanto no localStorage
      lastNotificationId.current = notification.id
      localStorage.setItem('lastShownNotificationId', notification.id)
      
      const toastType = notification.type === 'alert' ? 'error' : 
                       notification.type === 'signal' ? 'success' : 'info'
      
      let borderColor = '#22c55e' // Verde para sinais
      if (notification.type === 'alert') {
        borderColor = '#ef4444' // Vermelho para alertas
      } else if (notification.type === 'info') {
        borderColor = '#3b82f6' // Azul para informações
      }
      
      toast[toastType](notification.title, {
        description: notification.message,
        duration: 10000,
        position: 'top-center',
        style: {
          background: '#1a1a1a',
          border: `1px solid ${borderColor}`,
          color: '#ffffff',
          width: '400px', // Largura fixa para melhor visualização
          margin: '0 auto', // Centralizar horizontalmente
          textAlign: 'center' as const // Centralizar o texto
        },
        className: 'dark-toast'
      })
    }

    // Buscar notificações ativas
    const fetchActiveNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('aviator_notifications')
          .select('*')
          .eq('active', true)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error

        if (data?.[0]) {
          showToast(data[0])
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error)
      }
    }

    // Buscar notificações iniciais
    fetchActiveNotifications()

    // Configurar intervalo para verificar novas notificações a cada 5 segundos
    const interval = setInterval(fetchActiveNotifications, 5000)

    // Cleanup
    return () => {
      clearInterval(interval)
    }
  }, [supabase])

  // Não renderiza nada visualmente
  return null
} 