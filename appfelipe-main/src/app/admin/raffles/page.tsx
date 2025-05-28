'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

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

export default function RafflesAdmin() {
  const [raffles, setRaffles] = useState<Raffle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize: '',
    ticket_price: 0,
    max_tickets: '',
    draw_date: ''
  })

  useEffect(() => {
    fetchRaffles()
  }, [])

  const fetchRaffles = async () => {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRaffles(data || [])
    } catch (error) {
      console.error('Erro ao carregar sorteios:', error)
      toast.error('Erro ao carregar sorteios')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRaffle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('raffles')
        .insert({
          ...formData,
          max_tickets: formData.max_tickets ? parseInt(formData.max_tickets) : null,
          draw_date: new Date(formData.draw_date).toISOString()
        })

      if (error) throw error

      toast.success('Sorteio criado com sucesso!')
      setShowCreateModal(false)
      setFormData({
        title: '',
        description: '',
        prize: '',
        ticket_price: 0,
        max_tickets: '',
        draw_date: ''
      })
      fetchRaffles()
    } catch (error) {
      console.error('Erro ao criar sorteio:', error)
      toast.error('Erro ao criar sorteio')
    }
  }

  const handleDrawRaffle = async (raffleId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('draw_raffle', { raffle_id: raffleId })

      if (error) throw error

      toast.success('Sorteio realizado com sucesso!')
      fetchRaffles()
    } catch (error) {
      console.error('Erro ao realizar sorteio:', error)
      toast.error('Erro ao realizar sorteio')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">🎉 Gerenciar Sorteios</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Criar Novo Sorteio
          </button>
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
                <p className="text-red-400">
                  Status: <span className="text-white capitalize">{raffle.status}</span>
                </p>
              </div>

              {raffle.status === 'active' && (
                <button
                  onClick={() => handleDrawRaffle(raffle.id)}
                  className="w-full py-2 px-4 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Realizar Sorteio
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Modal de Criação */}
        <Transition appear show={showCreateModal} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => setShowCreateModal(false)}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-50" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1a0808] p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-white mb-4"
                    >
                      Criar Novo Sorteio
                    </Dialog.Title>

                    <form onSubmit={handleCreateRaffle} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-red-400 mb-1">
                          Título
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-400 mb-1">
                          Descrição
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-400 mb-1">
                          Prêmio
                        </label>
                        <input
                          type="text"
                          value={formData.prize}
                          onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                          className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-400 mb-1">
                          Preço do Ticket (pontos)
                        </label>
                        <input
                          type="number"
                          value={formData.ticket_price}
                          onChange={(e) => setFormData({ ...formData, ticket_price: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                          required
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-400 mb-1">
                          Número Máximo de Tickets (opcional)
                        </label>
                        <input
                          type="number"
                          value={formData.max_tickets}
                          onChange={(e) => setFormData({ ...formData, max_tickets: e.target.value })}
                          className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-400 mb-1">
                          Data do Sorteio
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.draw_date}
                          onChange={(e) => setFormData({ ...formData, draw_date: e.target.value })}
                          className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>

                      <div className="flex gap-4 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="flex-1 py-2 px-4 border border-red-800 text-white rounded-lg hover:bg-red-800/20 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 px-4 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Criar Sorteio
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  )
} 