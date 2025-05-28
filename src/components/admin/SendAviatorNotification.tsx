import { useState } from 'react'
import { useSupabase } from '@/contexts/SupabaseProvider'
import { toast } from 'sonner'

export default function SendAviatorNotification() {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    
    try {
      const { error } = await supabase.rpc('send_aviator_notification', {
        title_param: formData.get('title'),
        message_param: formData.get('message'),
        type_param: formData.get('type'),
        expires_in_minutes: parseInt(formData.get('expires') as string)
      })

      if (error) throw error

      toast.success('Notificação enviada com sucesso!', {
        style: {
          background: '#1a1a1a',
          border: '1px solid #22c55e',
          color: '#ffffff',
        },
        className: 'dark-toast'
      })
      form.reset()
    } catch (error) {
      toast.error('Erro ao enviar notificação', {
        style: {
          background: '#1a1a1a',
          border: '1px solid #ef4444',
          color: '#ffffff',
        },
        className: 'dark-toast'
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#1a0808] p-6 rounded-lg border border-red-800/50">
      <h2 className="text-2xl font-bold mb-4">Enviar Sinal Aviator</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-400">
            Título
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            className="mt-1 block w-full rounded-md bg-[#2a1010]/30 border border-red-800/50 text-white placeholder-red-500/50 focus:border-red-500 focus:ring-red-500"
            placeholder="Ex: Horário Pagante!"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-400">
            Mensagem
          </label>
          <textarea
            name="message"
            id="message"
            required
            rows={3}
            className="mt-1 block w-full rounded-md bg-[#2a1010]/30 border border-red-800/50 text-white placeholder-red-500/50 focus:border-red-500 focus:ring-red-500"
            placeholder="Ex: Próximos 5 minutos com alta chance de green. Entrada sugerida: 1.5x"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-400">
            Tipo
          </label>
          <select
            name="type"
            id="type"
            required
            className="mt-1 block w-full rounded-md bg-[#2a1010]/30 border border-red-800/50 text-white focus:border-red-500 focus:ring-red-500"
          >
            <option value="signal">Sinal (Verde)</option>
            <option value="alert">Alerta (Vermelho)</option>
            <option value="info">Informação (Azul)</option>
          </select>
        </div>

        <div>
          <label htmlFor="expires" className="block text-sm font-medium text-gray-400">
            Expirar em (minutos)
          </label>
          <input
            type="number"
            name="expires"
            id="expires"
            min="1"
            max="60"
            defaultValue="5"
            required
            className="mt-1 block w-full rounded-md bg-[#2a1010]/30 border border-red-800/50 text-white focus:border-red-500 focus:ring-red-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-red-800/50 rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar Notificação'}
        </button>
      </form>
    </div>
  )
} 