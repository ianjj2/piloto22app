'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

interface ShippingModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseId: string
}

const ShippingModal = ({ isOpen, onClose, purchaseId }: ShippingModalProps) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    telefone: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClientComponentClient()

      // Atualizar a compra com as informações de entrega
      const { error } = await supabase
        .from('purchases')
        .update({
          shipping_info: formData,
          status: 'completed'
        })
        .eq('id', purchaseId)

      if (error) throw error

      toast.success('Informações de entrega registradas com sucesso! Você receberá atualizações por email.')
      onClose()
    } catch (error: any) {
      toast.error('Erro ao salvar informações de entrega: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a0808] rounded-xl p-6 max-w-md w-full border border-red-800/30">
        <h2 className="text-2xl font-bold text-white mb-4">Informações de Entrega</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cep" className="block text-sm font-medium text-red-400 mb-1">
              CEP
            </label>
            <input
              id="cep"
              type="text"
              value={formData.cep}
              onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
              className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
              required
              maxLength={9}
              placeholder="00000-000"
            />
          </div>

          <div>
            <label htmlFor="endereco" className="block text-sm font-medium text-red-400 mb-1">
              Endereço
            </label>
            <input
              id="endereco"
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
              required
              placeholder="Rua, Avenida, etc"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-red-400 mb-1">
                Número
              </label>
              <input
                id="numero"
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                required
                placeholder="123"
              />
            </div>

            <div>
              <label htmlFor="complemento" className="block text-sm font-medium text-red-400 mb-1">
                Complemento
              </label>
              <input
                id="complemento"
                type="text"
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                placeholder="Apto, Sala, etc"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bairro" className="block text-sm font-medium text-red-400 mb-1">
              Bairro
            </label>
            <input
              id="bairro"
              type="text"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
              required
              placeholder="Seu bairro"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cidade" className="block text-sm font-medium text-red-400 mb-1">
                Cidade
              </label>
              <input
                id="cidade"
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                required
                placeholder="Sua cidade"
              />
            </div>

            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-red-400 mb-1">
                Estado
              </label>
              <input
                id="estado"
                type="text"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
                required
                maxLength={2}
                placeholder="UF"
              />
            </div>
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-red-400 mb-1">
              Telefone para Contato
            </label>
            <input
              id="telefone"
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full px-4 py-2 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500"
              required
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Confirmar Endereço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ShippingModal 