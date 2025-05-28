'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Profile } from '@/types/supabase'
import ShippingModal from '@/components/ShippingModal'
import ImageModal from '@/components/ImageModal'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Componente de Loading
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="card animate-pulse">
        <div className="w-full h-48 bg-red-500/10 rounded-t-lg mb-4" />
        <div className="h-6 bg-red-500/10 w-3/4 mb-2" />
        <div className="h-4 bg-red-500/10 w-full mb-4" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-red-500/10 w-24" />
          <div className="h-10 bg-red-500/10 w-24 rounded" />
        </div>
      </div>
    ))}
  </div>
)

export default function Store() {
  const queryClient = useQueryClient()
  const [showShippingModal, setShowShippingModal] = useState(false)
  const [currentPurchaseId, setCurrentPurchaseId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Query para buscar produtos
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('price', { ascending: true })
      
      return data || []
    },
    staleTime: 60000 // Cache por 1 minuto
  })

  const handlePurchase = async (product: Product) => {
    if (!profile) return

    if (profile.points < product.price) {
      setError('Pontos insuficientes para realizar a compra.')
      return
    }

    setPurchaseLoading(true)
    setError(null)

    try {
      // Verificar estoque
      if (product.stock !== null && product.stock !== undefined && product.stock < 1) {
        setError('Produto fora de estoque.')
        return
      }

      // Atualizar pontos do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          points: profile.points - product.price
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Atualizar estoque do produto
      if (product.stock !== null && product.stock !== undefined) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            stock: product.stock - 1
          })
          .eq('id', product.id)

        if (stockError) throw stockError
      }

      // Registrar a compra
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert([
          {
            user_id: profile.user_id,
            product_id: product.id,
            quantity: 1,
            total_price: product.price,
            status: 'pending'
          }
        ])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })

      // Mostrar modal de endereço
      setCurrentPurchaseId(purchaseData.id)
      setShowShippingModal(true)

      toast.success('Compra realizada com sucesso!')
    } catch (err: any) {
      setError(err.message)
      toast.error('Erro ao processar compra: ' + err.message)
    } finally {
      setPurchaseLoading(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">🛍️ Loja</h1>
            <div className="text-lg font-medium animate-pulse">
              <div className="h-6 bg-red-500/10 w-32 rounded" />
            </div>
          </div>
          <LoadingSkeleton />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🛍️ Loja</h1>
          <div className="text-lg font-medium">
            Seus pontos: <span className="text-primary">{profile?.points || 0}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card">
              {product.image_url && (
                <div 
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setSelectedImage({ url: product.image_url!, name: product.name })}
                >
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-t-lg mb-4"
                  />
                </div>
              )}
              <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-primary">
                  {product.price} pontos
                </span>
                <button
                  onClick={() => handlePurchase(product)}
                  disabled={purchaseLoading || (profile?.points || 0) < product.price}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {purchaseLoading ? 'Processando...' : 'Comprar'}
                </button>
              </div>
              {product.stock !== null && product.stock !== undefined && (
                <p className="text-sm text-gray-500 mt-2">
                  Estoque: {product.stock} unidades
                </p>
              )}
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-gray-600">Nenhum produto disponível no momento.</p>
          )}
        </div>

        {/* Modal de Endereço */}
        <ShippingModal
          isOpen={showShippingModal}
          onClose={() => setShowShippingModal(false)}
          purchaseId={currentPurchaseId || ''}
        />

        {/* Modal de Imagem */}
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage?.url || ''}
          productName={selectedImage?.name || ''}
        />
      </div>
    </main>
  )
} 