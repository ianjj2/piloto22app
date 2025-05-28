'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import Image from 'next/image'

interface Profile {
  id: string
  username: string
  avatar_url?: string
  platform_id?: string
  level: number
  points: number
  created_at: string
}

interface PointHistory {
  id: string
  user_id: string
  amount: number
  type: 'earned' | 'spent'
  description: string
  created_at: string
}

interface PurchaseData {
  id: string
  total_price: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  products: {
    name: string
    description: string
  } | null
}

interface Purchase {
  id: string
  product: {
    name: string
    description: string
  }
  total_price: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    platform_id: '',
    avatar_url: ''
  })

  const supabase = createClientComponentClient()

  const fetchProfileData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (profileError) throw profileError
      if (profileData) {
        setProfile(profileData)
        setFormData({
          username: profileData.username,
          platform_id: profileData.platform_id || '',
          avatar_url: profileData.avatar_url || ''
        })
      }

      // Buscar histórico de pontos
      const { data: historyData, error: historyError } = await supabase
        .from('point_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (historyError) throw historyError
      if (historyData) setPointHistory(historyData)

      // Buscar compras
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          id,
          total_price,
          status,
          created_at,
          products (
            name,
            description
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (purchasesError) throw purchasesError
      if (purchasesData) {
        const formattedPurchases: Purchase[] = (purchasesData as unknown as PurchaseData[]).map(p => ({
          id: p.id,
          total_price: p.total_price,
          status: p.status,
          created_at: p.created_at,
          product: {
            name: p.products?.name || 'Produto não encontrado',
            description: p.products?.description || ''
          }
        }))
        setPurchases(formattedPurchases)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          platform_id: formData.platform_id,
          avatar_url: formData.avatar_url
        })
        .eq('user_id', session.user.id)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      setEditing(false)
      fetchProfileData()
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil')
    }
  }

  const getLevelProgress = () => {
    if (!profile) return 0
    const pointsForNextLevel = (profile.level + 1) * 1000
    const progress = (profile.points / pointsForNextLevel) * 100
    return Math.min(progress, 100)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem')
        return
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB')
        return
      }

      setUploading(true)

      // Gerar nome único para o arquivo
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Deletar avatar antigo se existir
      if (profile?.avatar_url) {
        const oldFilePath = profile.avatar_url.split('/').pop()
        if (oldFilePath) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${oldFilePath}`])
        }
      }

      // Upload do novo avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      toast.success('Avatar atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error)
      toast.error('Erro ao atualizar avatar. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cabeçalho do Perfil */}
        <div className="bg-[#1a0808]/90 rounded-lg p-6 border border-red-800">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Avatar"
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
                  <span className="text-3xl text-red-500">
                    {profile?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {editing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <label className="cursor-pointer bg-black/50 rounded-full w-full h-full flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <span className="text-white text-xs">
                      {uploading ? 'Enviando...' : 'Alterar'}
                    </span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-red-500">{profile?.username}</h1>
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  {editing ? 'Cancelar' : 'Editar Perfil'}
                </button>
              </div>
              <p className="text-gray-400 mt-1">
                Membro desde {new Date(profile?.created_at || '').toLocaleDateString('pt-BR')}
              </p>
              {profile?.platform_id && (
                <p className="text-gray-400">ID da Plataforma: {profile.platform_id}</p>
              )}
            </div>
          </div>

          {/* Formulário de Edição */}
          {editing && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nome de usuário
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-[#2a1010]/30 border border-red-800/50 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  ID da Plataforma
                </label>
                <input
                  type="text"
                  value={formData.platform_id}
                  onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
                  className="w-full bg-[#2a1010]/30 border border-red-800/50 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  URL da foto de perfil
                </label>
                <input
                  type="text"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  className="w-full bg-[#2a1010]/30 border border-red-800/50 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Salvar alterações
              </button>
            </div>
          )}
        </div>

        {/* Nível e Progresso */}
        <div className="bg-[#1a0808]/90 rounded-lg p-6 border border-red-800">
          <h2 className="text-xl font-semibold text-red-500 mb-4">Nível e Progresso</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Nível {profile?.level}</span>
              <span className="text-red-500">{profile?.points} pontos</span>
            </div>
            <div className="w-full bg-red-500/10 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getLevelProgress()}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">
              Próximo nível em {((profile?.level || 0) + 1) * 1000 - (profile?.points || 0)} pontos
            </p>
          </div>
        </div>

        {/* Histórico de Pontos */}
        <div className="bg-[#1a0808]/90 rounded-lg p-6 border border-red-800">
          <h2 className="text-xl font-semibold text-red-500 mb-4">Histórico de Pontos</h2>
          <div className="space-y-3">
            {pointHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 px-4 bg-[#2a1010]/30 rounded-lg"
              >
                <div>
                  <p className="text-gray-300">{entry.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className={`font-medium ${
                  entry.type === 'earned' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {entry.type === 'earned' ? '+' : '-'}{entry.amount}
                </span>
              </div>
            ))}
            {pointHistory.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Nenhum histórico de pontos encontrado
              </p>
            )}
          </div>
        </div>

        {/* Histórico de Compras */}
        <div className="bg-[#1a0808]/90 rounded-lg p-6 border border-red-800">
          <h2 className="text-xl font-semibold text-red-500 mb-4">Histórico de Compras</h2>
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="p-4 bg-[#2a1010]/30 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-gray-300 font-medium">
                      {purchase.product?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {purchase.product?.description}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    purchase.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    purchase.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {purchase.status === 'completed' ? 'Concluído' :
                     purchase.status === 'cancelled' ? 'Cancelado' :
                     'Pendente'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {new Date(purchase.created_at).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-red-500 font-medium">
                    {purchase.total_price} pontos
                  </span>
                </div>
              </div>
            ))}
            {purchases.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Nenhuma compra encontrada
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}