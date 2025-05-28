'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/supabase'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'

const ITEMS_PER_PAGE = 20

interface WeeklyRankingUser {
  user_id: string
  username: string
  points: number
  rank: number
}

const getLevelText = (level: number): string => {
  switch (level) {
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

// Componente de Loading
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#0a0808] flex flex-col">
    <div className="bg-[#1a0808]/90 border-b border-red-800 backdrop-blur-sm py-2">
      <div className="max-w-7xl mx-auto px-3">
        <div className="flex items-center gap-2 w-full">
          {/* Entrada Sugerida Skeleton */}
          <div className="flex-1 bg-[#1a0808] p-2 rounded-lg border border-blue-800/50 animate-pulse">
            <div className="text-center space-y-2">
              <div className="h-4 bg-blue-500/20 rounded w-24 mx-auto"></div>
              <div className="h-6 bg-blue-500/20 rounded w-16 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default function Ranking() {
  const { ref, inView } = useInView()
  const [activeTab, setActiveTab] = useState<'global' | 'weekly'>('global')

  // Query para ranking global
  const fetchGlobalProfiles = async ({ pageParam = 0 }) => {
    const start = pageParam * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, points, level')
      .order('points', { ascending: false })
      .range(start, end)

    if (error) throw error
    return data
  }

  const {
    data: globalData,
    fetchNextPage: fetchNextGlobalPage,
    hasNextPage: hasNextGlobalPage,
    isFetchingNextPage: isFetchingNextGlobalPage,
    status: globalStatus,
  } = useInfiniteQuery({
    queryKey: ['ranking', 'global'],
    queryFn: fetchGlobalProfiles,
    getNextPageParam: (lastPage, pages) => {
      return lastPage?.length === ITEMS_PER_PAGE ? pages.length : undefined
    },
    staleTime: 60000, // 1 minuto
    initialPageParam: 0
  })

  // Query para ranking semanal
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    error: weeklyError
  } = useQuery({
    queryKey: ['ranking', 'weekly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_weekly_ranking')

      if (error) throw error
      return data
    },
    staleTime: 60000 // 1 minuto
  })

  useEffect(() => {
    if (inView && hasNextGlobalPage && activeTab === 'global') {
      fetchNextGlobalPage()
    }
  }, [inView, hasNextGlobalPage, fetchNextGlobalPage, activeTab])

  // Componente para medalhas do top 3
  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 0:
        return '🥇'
      case 1:
        return '🥈'
      case 2:
        return '🥉'
      default:
        return ''
    }
  }

  const allGlobalProfiles = globalData?.pages.flat() || []

  if (globalStatus === 'pending' || weeklyLoading) return <LoadingSkeleton />

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 flex items-center gap-2">
          <span className="text-3xl">🏆</span> Ranking
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'global'
                ? 'bg-red-500 text-white'
                : 'bg-[#1a0808] text-gray-300 hover:bg-red-500/10'
            }`}
          >
            Ranking Global
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'weekly'
                ? 'bg-red-500 text-white'
                : 'bg-[#1a0808] text-gray-300 hover:bg-red-500/10'
            }`}
          >
            Ranking Semanal
          </button>
        </div>

        {activeTab === 'global' ? (
          <>
            {/* Versão Mobile (Cards) */}
            <div className="block sm:hidden space-y-3">
              {allGlobalProfiles.map((profile, index) => (
                <div
                  key={profile.id}
                  className="glass-effect rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-gray-300 min-w-[30px]">
                      {getMedalEmoji(index) || `${index + 1}º`}
                    </div>
                    <div>
                      <div className="font-medium text-gray-300">{profile.username}</div>
                      <div className="text-sm text-gray-400">{profile.points || 0} pts</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300">
                    {getLevelText(profile.level)}
                  </span>
                </div>
              ))}
            </div>

            {/* Versão Desktop (Tabela) */}
            <div className="hidden sm:block glass-effect rounded-xl overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Posição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nível
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Pontos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-800/20">
                  {allGlobalProfiles.map((profile, index) => (
                    <tr key={profile.id} className="text-gray-300">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {getMedalEmoji(index) || `${index + 1}º`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {profile.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/20 text-red-300">
                          {getLevelText(profile.level)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {profile.points || 0} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Loading More Indicator */}
            {(isFetchingNextGlobalPage || hasNextGlobalPage) && (
              <div ref={ref} className="py-4">
                <LoadingSkeleton />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Versão Mobile (Cards) */}
            <div className="block sm:hidden space-y-3">
              {weeklyData?.map((user: WeeklyRankingUser, index: number) => (
                <div
                  key={user.user_id}
                  className="glass-effect rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-gray-300 min-w-[30px]">
                      {getMedalEmoji(index) || `${index + 1}º`}
                    </div>
                    <div>
                      <div className="font-medium text-gray-300">{user.username}</div>
                      <div className="text-sm text-gray-400">{user.points || 0} pts</div>
                    </div>
                  </div>
                  {/* Premiação Mobile */}
                  {index === 0 && <span className="text-yellow-400 font-bold ml-2">R$500 - 1º Lugar</span>}
                  {index === 1 && <span className="text-gray-300 font-bold ml-2">R$300 - 2º Lugar</span>}
                  {index === 2 && <span className="text-orange-400 font-bold ml-2">R$200 - 3º Lugar</span>}
                </div>
              ))}
            </div>

            {/* Versão Desktop (Tabela) */}
            <div className="hidden sm:block glass-effect rounded-xl overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Posição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Pontos da Semana
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Premiação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-800/20">
                  {weeklyData?.map((user: WeeklyRankingUser, index: number) => (
                    <tr key={user.user_id} className="text-gray-300">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {getMedalEmoji(index) || `${index + 1}º`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.points || 0} pts
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        {index === 0 && <span className="text-yellow-400">R$500 - 1º Lugar</span>}
                        {index === 1 && <span className="text-gray-300">R$300 - 2º Lugar</span>}
                        {index === 2 && <span className="text-orange-400">R$200 - 3º Lugar</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  )
} 
