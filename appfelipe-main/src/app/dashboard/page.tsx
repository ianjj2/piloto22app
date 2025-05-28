'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Profile, Post } from '@/types/supabase'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Função para extrair o ID do vídeo do YouTube da URL
const getYoutubeVideoId = (url: string) => {
  if (!url) return null
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : null
}

const getLevelText = (level: number): string => {
  switch (level) {
    case 0:
      return 'Todos'
    case 1:
      return 'Iniciante'
    case 2:
      return 'Intermediário'
    case 3:
      return 'Avançado'
    default:
      return 'Iniciante'
  }
}

// Componente de Loading para os Cards
const CardSkeleton = () => (
  <div className="glass-effect rounded-xl p-6 subtle-shadow animate-pulse">
    <div className="h-4 bg-red-500/10 w-1/3 mb-2" />
    <div className="h-6 bg-red-500/10 w-1/2" />
  </div>
)

// Componente de Loading para os Posts
const PostSkeleton = () => (
  <div className="card animate-pulse">
    <div className="relative aspect-video mb-4">
      <div className="w-full h-full bg-red-500/10 rounded-lg" />
    </div>
    <div className="h-6 bg-red-500/10 w-3/4 mb-2" />
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-red-500/10 w-full" />
      <div className="h-4 bg-red-500/10 w-5/6" />
      <div className="h-4 bg-red-500/10 w-4/6" />
    </div>
    <div className="flex justify-between items-center">
      <div className="h-4 bg-red-500/10 w-24" />
      <div className="h-4 bg-red-500/10 w-32" />
    </div>
  </div>
)

export default function Dashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [notification, setNotification] = useState<{points: number, streak: number} | null>(null)

  // Query para buscar e verificar sessão
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return null
      }
      return session
    },
    staleTime: 30000 // Cache por 30 segundos
  })

  // Query para registrar login diário
  useQuery({
    queryKey: ['dailyLogin'],
    queryFn: async () => {
      if (!session) return null
      
      const { data: loginPoints, error: loginError } = await supabase
        .rpc('register_daily_login')

      if (loginPoints > 0 && !loginError) {
        const { data: streakData } = await supabase
          .from('point_transactions')
          .select('reason')
          .eq('user_id', session.user.id)
          .like('reason', 'Login diário%')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const currentStreak = parseInt(streakData?.reason.match(/Streak: (\d+)/)?.[1] || '1', 10)
        setNotification({ points: loginPoints, streak: currentStreak })
        
        setTimeout(() => {
          setNotification(null)
        }, 5000)
      }

      return loginPoints
    },
    enabled: !!session,
    staleTime: Infinity // Executar apenas uma vez por sessão
  })

  // Query para buscar perfil
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!session) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!session,
    staleTime: 30000 // Cache por 30 segundos
  })

  // Query para buscar posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts', profile?.level],
    queryFn: async () => {
      if (!profile) return []
      
      const { data } = await supabase
        .from('posts')
        .select('*')
        .or(`target_level.eq.${profile.level},target_level.eq.0`)
        .order('created_at', { ascending: false })
      
      return data || []
    },
    enabled: !!profile,
    staleTime: 60000 // Cache por 1 minuto
  })

  // Inscrever-se para atualizações em tempo real do perfil
  useQuery({
    queryKey: ['profileSubscription'],
    queryFn: async () => {
      if (!session) return null

      const subscription = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            queryClient.setQueryData(['profile'], payload.new)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    },
    enabled: !!session
  })

  if (profileLoading) {
    return (
      <main className="min-h-screen p-8 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="mb-12">
            <div className="h-8 bg-red-500/10 w-64 mb-2 rounded" />
            <div className="h-4 bg-red-500/10 w-48 rounded" />
          </div>

          {/* Status Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>

          {/* Action Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>

          {/* Posts Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-red-500/10 w-48 mb-6 rounded" />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
            Erro ao carregar perfil
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Voltar para o Login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-medium text-white mb-2">
            Bem-vindo(a), {profile.username}
          </h1>
          <p className="text-gray-400">Confira suas informações e novidades</p>
        </div>

        {/* Popup de pontos */}
        {notification && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Overlay com blur */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNotification(null)} />
            
            {/* Popup */}
            <div className="relative glass-effect rounded-2xl p-8 subtle-shadow border border-green-500/20 bg-[#1a0808]/90 backdrop-blur-md max-w-md w-full mx-4 animate-scale-up">
              {/* Botão de fechar */}
              <button 
                onClick={() => setNotification(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Conteúdo */}
              <div>
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">Parabéns!</h2>
                <p className="text-lg text-green-300/90 mb-4">
                  Você ganhou <span className="font-bold text-green-400">{notification.points} pontos</span>
                </p>
                <p className="text-green-300/80">
                  Você está em uma sequência de <span className="font-semibold text-green-400">{notification.streak} {notification.streak === 1 ? 'dia' : 'dias'}</span> de login!
                </p>
                <button
                  onClick={() => setNotification(null)}
                  className="mt-6 px-6 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-effect rounded-xl p-6 subtle-shadow">
            <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Seu Nível</h2>
            <p className="text-2xl font-medium text-white">{getLevelText(profile.level)}</p>
          </div>
          <div className="glass-effect rounded-xl p-6 subtle-shadow">
            <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Seus Pontos</h2>
            <p className="text-2xl font-medium text-white">{profile.points || 0}</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-effect rounded-xl p-6 subtle-shadow">
            <div className="flex items-center mb-4">
              <span className="text-xl mr-2">🎮</span>
              <h2 className="text-white font-medium">Aviator Game</h2>
            </div>
            <Link 
              href="/aviator"
              className="button-modern w-full py-2 px-4 rounded-lg text-white text-center font-medium block"
            >
              Jogar Agora
            </Link>
          </div>

          <div className="glass-effect rounded-xl p-6 subtle-shadow">
            <div className="flex items-center mb-4">
              <span className="text-xl mr-2">🏆</span>
              <h2 className="text-white font-medium">Ranking</h2>
            </div>
            <Link 
              href="/ranking"
              className="button-secondary w-full py-2 px-4 rounded-lg text-white text-center font-medium block"
            >
              Ver Ranking
            </Link>
          </div>

          <div className="glass-effect rounded-xl p-6 subtle-shadow">
            <div className="flex items-center mb-4">
              <span className="text-xl mr-2">🛍️</span>
              <h2 className="text-white font-medium">Loja</h2>
            </div>
            <Link 
              href="/store"
              className="button-secondary w-full py-2 px-4 rounded-lg text-white text-center font-medium block"
            >
              Ver Produtos
            </Link>
          </div>
        </div>

        {/* Updates Section */}
        <div>
          <h2 className="text-xl font-medium text-white mb-6">Últimas Atualizações</h2>
          <div className="space-y-4">
            {postsLoading ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="card">
                  {post.banner_url && (
                    <div className="relative aspect-video mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.banner_url}
                        alt={post.title}
                        className="rounded-lg w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                  <p className="text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
                  {post.youtube_url && (
                    <div className="aspect-video mb-4">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${getYoutubeVideoId(post.youtube_url)}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>
                      Nível: {getLevelText(post.target_level)}
                    </span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                Nenhuma atualização disponível.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
} 