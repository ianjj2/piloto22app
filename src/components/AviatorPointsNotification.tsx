'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/contexts/SupabaseProvider'
import { toast } from 'sonner'

export default function AviatorPointsNotification() {
  const { supabase } = useSupabase()
  const [lastPoints, setLastPoints] = useState<number | null>(null)

  useEffect(() => {
    const checkPoints = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('points')
          .eq('user_id', session.user.id)
          .single()

        if (error) throw error

        if (lastPoints !== null && profile.points > lastPoints) {
          const pointsEarned = profile.points - lastPoints
          toast.success('🎉 Parabéns!', {
            description: `Você ganhou ${pointsEarned} pontos no Aviator!`,
            duration: 5000,
            position: 'top-center',
            style: {
              background: '#1a1a1a',
              border: '1px solid #2f2f2f',
              color: '#ffffff',
            },
            className: 'dark-toast'
          })
        }

        setLastPoints(profile.points)
      } catch (error) {
        console.error('Erro ao verificar pontos:', error)
      }
    }

    // Verificar pontos a cada 5 segundos
    const interval = setInterval(checkPoints, 5000)

    // Verificar pontos inicialmente
    checkPoints()

    return () => clearInterval(interval)
  }, [supabase, lastPoints])

  return null
} 