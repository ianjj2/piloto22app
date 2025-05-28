'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

export default function NewProduct() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    price: '',
    stock: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClientComponentClient()
      
      const { error } = await supabase
        .from('products')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            image_url: formData.image_url,
            price: parseInt(formData.price),
            stock: parseInt(formData.stock)
          }
        ])

      if (error) throw error

      toast.success('Produto criado com sucesso!')
      router.push('/admin')
    } catch (error: any) {
      toast.error('Erro ao criar produto: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Novo Produto</h1>

        <div className="glass-effect rounded-2xl p-8 subtle-shadow border border-red-800/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-red-400 mb-1">
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-red-400 mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-32 px-4 py-3 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500 transition-colors resize-none"
                required
              />
            </div>

            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-red-400 mb-1">
                🖼️ URL da Imagem (opcional)
              </label>
              <input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full px-4 py-3 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-red-400 mb-1">
                Custo em Pontos
              </label>
              <input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500 transition-colors"
                required
                min="0"
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-red-400 mb-1">
                Estoque
              </label>
              <input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-3 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500 transition-colors"
                required
                min="0"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1a0808] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Produto'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
} 