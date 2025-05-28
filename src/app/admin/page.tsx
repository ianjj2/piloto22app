'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import SendAviatorNotification from '@/components/admin/SendAviatorNotification'

interface Profile {
  id: string
  username: string
  avatar_url?: string
  platform_id?: string
  level: number
  points: number
  created_at: string
  last_seen: string
}

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const errors: string[] = []

        // Buscar perfis
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profilesError) {
          console.error('Erro ao buscar perfis:', profilesError)
          errors.push('perfis')
        } else if (profilesData) {
          setProfiles(profilesData)
          
          // Filtrar usuários online (última atividade nos últimos 5 minutos)
          const now = new Date()
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
          
          const onlineUsers = profilesData.filter(profile => {
            const lastSeen = new Date(profile.last_seen || profile.created_at)
            return lastSeen > fiveMinutesAgo
          })
          
          setOnlineUsers(onlineUsers)
        }

        // Buscar total de posts
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })

        if (postsError) {
          console.error('Erro ao buscar posts:', postsError)
          errors.push('posts')
        } else {
          setTotalPosts(postsCount || 0)
        }

        // Buscar total de produtos
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })

        if (productsError) {
          console.error('Erro ao buscar produtos:', productsError)
          errors.push('produtos')
        } else {
          setTotalProducts(productsCount || 0)
        }

        if (errors.length > 0) {
          toast.error(`Erro ao carregar: ${errors.join(', ')}`, {
            duration: 5000,
            id: 'fetch-error'
          })
        }
      } catch (error) {
        console.error('Erro geral ao carregar dados:', error)
        toast.error('Erro ao carregar dados do painel', {
          duration: 5000,
          id: 'general-error'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getLevelText = (level: number) => {
    switch (level) {
      case 1:
        return 'Iniciante'
      case 2:
        return 'Intermediário'
      case 3:
        return 'Avançado'
      default:
        return 'Desconhecido'
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      
      toast.success('Usuário deletado com sucesso!')
      
      const { data: newProfiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (newProfiles) {
        setProfiles(newProfiles)
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      toast.error('Erro ao deletar usuário')
    }
  }

  const handleNavigateToNewPost = () => {
    router.push('/admin/posts/new')
  }

  const handleNavigateToNewProduct = () => {
    router.push('/admin/products/new')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-red-500">Painel Administrativo</h1>
              <p className="text-gray-400">Gerenciamento e monitoramento do sistema</p>
            </div>
            <div className="space-x-2">
              <button 
                onClick={handleNavigateToNewPost}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                + Criar Post
              </button>
              <button 
                onClick={handleNavigateToNewProduct}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                + Adicionar Produto
              </button>
            </div>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a0808]/90 p-4 rounded-lg border border-red-800 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Total de Posts</p>
                  <h3 className="text-2xl font-bold text-red-500">{totalPosts}</h3>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-[#1a0808]/90 p-4 rounded-lg border border-red-800 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Produtos Cadastrados</p>
                  <h3 className="text-2xl font-bold text-red-500">{totalProducts}</h3>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-[#1a0808]/90 p-4 rounded-lg border border-red-800 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Usuários Online</p>
                  <h3 className="text-2xl font-bold text-red-500">{onlineUsers.length}</h3>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full">
                  <div className="w-3 h-3 bg-green-500 rounded-full ring-2 ring-green-500/20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção principal com grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estatísticas do Sistema */}
            <div className="bg-[#1A1A1A] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-500 mb-6">Estatísticas do Sistema</h2>
              <div className="space-y-4">
                <div className="bg-[#2a1010]/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Posts</span>
                    <span className="text-xl font-semibold text-red-500">{totalPosts}</span>
                  </div>
                  <div className="w-full bg-red-500/10 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="bg-[#2a1010]/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Produtos</span>
                    <span className="text-xl font-semibold text-red-500">{totalProducts}</span>
                  </div>
                  <div className="w-full bg-red-500/10 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sinais do Aviator */}
            <div className="bg-[#1A1A1A] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-red-500">Sinais do Aviator</h2>
              </div>
              <SendAviatorNotification />
            </div>

            {/* Atividades Recentes */}
            <div className="bg-[#1A1A1A] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-500 mb-6">Atividades Recentes</h2>
              <div className="space-y-4">
                {onlineUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-4 py-3 px-4 rounded-md bg-[#2a1010]/30">
                    <div className="w-2 h-2 bg-green-500 rounded-full ring-2 ring-green-500/20"></div>
                    <div>
                      <p className="text-gray-300">{user.username} está online</p>
                      <p className="text-gray-500 text-sm">
                        Último acesso: {new Date(user.last_seen).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cards inferiores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => router.push('/admin/posts')}
              className="bg-[#1A1A1A] rounded-lg p-6 cursor-pointer hover:bg-[#2a1010] transition-colors"
            >
              <h3 className="text-xl mb-2 text-red-500">Posts</h3>
              <p className="text-gray-400">Gerenciar posts e conteúdo</p>
            </div>
            <div 
              onClick={() => router.push('/admin/products')}
              className="bg-[#1A1A1A] rounded-lg p-6 cursor-pointer hover:bg-[#2a1010] transition-colors"
            >
              <h3 className="text-xl mb-2 text-red-500">Produtos</h3>
              <p className="text-gray-400">Gerenciar produtos da loja</p>
            </div>
            <div 
              onClick={() => router.push('/admin/raffles')}
              className="bg-[#1A1A1A] rounded-lg p-6 cursor-pointer hover:bg-[#2a1010] transition-colors"
            >
              <h3 className="text-xl mb-2 text-red-500">Sorteios</h3>
              <p className="text-gray-400">Gerenciar sorteios e vencedores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 