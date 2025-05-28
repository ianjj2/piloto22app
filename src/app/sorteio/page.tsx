'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'

interface Raffle {
  id: string
  title: string
  description: string
  prize: string
  ticket_price: number
  max_tickets: number | null
  draw_date: string
  status: 'active' | 'completed' | 'cancelled'
  winner_id: string | null
  created_at: string
}

interface RaffleTicket {
  id: string
  raffle_id: string
  user_id: string
  ticket_number: number
  created_at: string
}

// Componente de Loading
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-[#1a0808] rounded-xl p-6 border border-red-800/30 animate-pulse">
        <div className="h-6 bg-red-500/10 w-3/4 mb-4" />
        <div className="h-4 bg-red-500/10 w-full mb-6" />
        <div className="space-y-4 mb-6">
          <div className="h-4 bg-red-500/10 w-1/2" />
          <div className="h-4 bg-red-500/10 w-2/3" />
          <div className="h-4 bg-red-500/10 w-3/4" />
        </div>
        <div className="h-10 bg-red-500/10 w-full rounded-lg" />
      </div>
    ))}
  </div>
)

export default function Sorteio() {
  const queryClient = useQueryClient()
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null)

  // Query para buscar o perfil do usuário
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      return data
    },
    staleTime: 30000 // Cache por 30 segundos
  })

  // Query para buscar sorteios
  const { data: raffles = [], isLoading: rafflesLoading } = useQuery({
    queryKey: ['raffles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('raffles')
        .select('*')
        .order('draw_date', { ascending: true })
      
      return data || []
    },
    staleTime: 30000, // Cache por 30 segundos
    refetchInterval: 60000 // Revalidar a cada 1 minuto
  })

  // Query para buscar tickets do usuário
  const { data: tickets = [] } = useQuery({
    queryKey: ['userTickets'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return []
      
      const { data } = await supabase
        .from('raffle_tickets')
        .select('*')
        .eq('user_id', session.user.id)
      
      return data || []
    },
    staleTime: 30000 // Cache por 30 segundos
  })

  // Mutation para comprar tickets
  const buyTicketMutation = useMutation({
    mutationFn: async (raffle: Raffle) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Você precisa estar logado para comprar tickets')
      if (!profile) throw new Error('Perfil não encontrado')
      
      // Verificar se o usuário tem pontos suficientes
      if (profile.points < raffle.ticket_price) {
        throw new Error('Pontos insuficientes para comprar o ticket')
      }

      // Verificar se ainda há tickets disponíveis
      if (raffle.max_tickets) {
        const { count } = await supabase
          .from('raffle_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('raffle_id', raffle.id)

        if (count && count >= raffle.max_tickets) {
          throw new Error('Todos os tickets já foram vendidos')
        }
      }

      // Gerar número do ticket com verificação de duplicidade
      let ticketNumber = Math.floor(Math.random() * 1000000) + 1
      let isUnique = false
      
      while (!isUnique) {
        ticketNumber = Math.floor(Math.random() * 1000000) + 1
        const { data: existingTicket } = await supabase
          .from('raffle_tickets')
          .select('id')
          .eq('raffle_id', raffle.id)
          .eq('ticket_number', ticketNumber)
          .single()
          
        if (!existingTicket) {
          isUnique = true
        }
      }

      // Criar ticket
      const { error: ticketError } = await supabase
        .from('raffle_tickets')
        .insert({
          raffle_id: raffle.id,
          user_id: session.user.id,
          ticket_number: ticketNumber
        })

      if (ticketError) throw ticketError

      // Deduzir pontos com verificação de concorrência
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ points: profile.points - raffle.ticket_price })
        .eq('user_id', session.user.id)
        .eq('points', profile.points) // Garantir que os pontos não mudaram

      if (pointsError) throw new Error('Erro ao atualizar pontos. Tente novamente.')

      return { ticketNumber }
    },
    onSuccess: () => {
      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['userTickets'] })
      queryClient.invalidateQueries({ queryKey: ['raffles'] })
      
      toast.success('Ticket comprado com sucesso!')
      setSelectedRaffle(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  if (rafflesLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">🎉 Sorteios</h1>
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">🎉 Sorteios</h1>
          <div className="text-lg font-medium text-white">
            Seus pontos: <span className="text-red-500">{profile?.points || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {raffles.map((raffle) => (
            <div
              key={raffle.id}
              className="bg-[#1a0808] rounded-xl p-6 border border-red-800/30"
            >
              <h2 className="text-xl font-semibold text-white mb-2">
                {raffle.title}
              </h2>
              <p className="text-gray-400 mb-4">{raffle.description}</p>
              
              <div className="space-y-2 mb-4">
                <p className="text-red-400">
                  Prêmio: <span className="text-white">{raffle.prize}</span>
                </p>
                <p className="text-red-400">
                  Preço do ticket: <span className="text-white">{raffle.ticket_price} pontos</span>
                </p>
                <p className="text-red-400">
                  Data do sorteio: <span className="text-white">
                    {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                  </span>
                </p>
                {raffle.max_tickets && (
                  <p className="text-red-400">
                    Tickets vendidos: <span className="text-white">
                      {tickets.filter(t => t.raffle_id === raffle.id).length} / {raffle.max_tickets}
                    </span>
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedRaffle(raffle)}
                className="w-full py-2 px-4 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={raffle.status !== 'active' || buyTicketMutation.isPending}
              >
                {raffle.status === 'active' 
                  ? (buyTicketMutation.isPending ? 'Processando...' : 'Participar')
                  : 'Sorteio Encerrado'}
              </button>
            </div>
          ))}
        </div>

        {/* Modal de Confirmação */}
        {selectedRaffle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a0808] rounded-xl p-6 max-w-md w-full border border-red-800/30">
              <h2 className="text-2xl font-bold text-white mb-4">
                Confirmar Participação
              </h2>
              <p className="text-gray-400 mb-4">
                Você está prestes a comprar um ticket para o sorteio &quot;{selectedRaffle.title}&quot;.
                O custo será de {selectedRaffle.ticket_price} pontos.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedRaffle(null)}
                  className="flex-1 py-2 px-4 border border-red-800 text-white rounded-lg hover:bg-red-800/20 transition-colors"
                  disabled={buyTicketMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => buyTicketMutation.mutate(selectedRaffle)}
                  disabled={buyTicketMutation.isPending}
                  className="flex-1 py-2 px-4 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {buyTicketMutation.isPending ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 