'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Profile, UserLevel } from '@/types/supabase'

export default function Navigation() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        setProfile(data)
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
      } finally {
        setLoading(false)
      }
    }

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return null

  return (
    <nav className="bg-[#1a0808]/90 border-b border-red-800 backdrop-blur-sm shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="w-32 h-8 relative">
                <Image
                  src="/assets/Logo.png"
                  alt="Logo"
                  fill
                  sizes="(max-width: 768px) 100vw, 200px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/ranking"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/ranking'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-gray-300 hover:border-red-400 hover:text-red-400'
                }`}
              >
                Ranking
              </Link>

              {profile ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/dashboard'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-300 hover:border-red-400 hover:text-red-400'
                    }`}
                  >
                    Home
                  </Link>

                  <Link
                    href="/aviator"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/aviator'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-300 hover:border-red-400 hover:text-red-400'
                    }`}
                  >
                    Aviator
                  </Link>

                  <Link
                    href="/store"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/store'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-300 hover:border-red-400 hover:text-red-400'
                    }`}
                  >
                    Loja
                  </Link>

                  <Link
                    href="/sorteio"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/sorteio'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-300 hover:border-red-400 hover:text-red-400'
                    }`}
                  >
                    Sorteios
                  </Link>

                  <Link
                    href="/calculadora"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/calculadora'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-300 hover:border-red-400 hover:text-red-400'
                    }`}
                  >
                    Calculadora
                  </Link>

                  <Link
                    href="/perfil"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/perfil'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-300 hover:border-red-400 hover:text-red-400'
                    }`}
                  >
                    Perfil
                  </Link>
                </>
              ) : null}

              {profile && profile.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname.startsWith('/admin')
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-gray-300 hover:border-red-400 hover:text-red-400'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {profile ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-red-400">
                  {profile.points} pontos
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-300 hover:text-red-400 transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-300 hover:text-red-400 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm text-gray-300 hover:text-red-400 transition-colors"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Botão do Menu Mobile */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-red-400 hover:bg-red-800/20 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menu principal</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      <div
        className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/ranking"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/ranking'
                ? 'bg-red-800/20 text-red-500'
                : 'text-gray-300 hover:bg-red-800/20 hover:text-red-400'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Ranking
          </Link>

          {profile ? (
            <>
              <Link
                href="/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/dashboard'
                    ? 'bg-red-800/20 text-red-500'
                    : 'text-gray-300 hover:bg-red-800/20 hover:text-red-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              <Link
                href="/aviator"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/aviator'
                    ? 'bg-red-800/20 text-red-500'
                    : 'text-gray-300 hover:bg-red-800/20 hover:text-red-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Aviator
              </Link>

              <Link
                href="/store"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/store'
                    ? 'bg-red-800/20 text-red-500'
                    : 'text-gray-300 hover:bg-red-800/20 hover:text-red-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Loja
              </Link>

              <Link
                href="/sorteio"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/sorteio'
                    ? 'bg-red-800/20 text-red-500'
                    : 'text-gray-300 hover:bg-red-800/20 hover:text-red-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sorteios
              </Link>

              <Link
                href="/calculadora"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/calculadora'
                    ? 'bg-red-800/20 text-red-500'
                    : 'text-gray-300 hover:bg-red-800/20 hover:text-red-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Calculadora
              </Link>

              <Link
                href="/perfil"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/perfil'
                    ? 'bg-red-800/20 text-red-500'
                    : 'text-gray-300 hover:bg-red-800/20 hover:text-red-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Perfil
              </Link>

              {profile.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname.startsWith('/admin')
                      ? 'bg-red-800/20 text-red-500'
                      : 'text-gray-300 hover:bg-red-800/20 hover:text-red-400'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}

              <div className="px-3 py-2 flex justify-between items-center">
                <span className="text-sm text-red-400">
                  {profile.points} pontos
                </span>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="text-sm text-gray-300 hover:text-red-400 transition-colors"
                >
                  Sair
                </button>
              </div>
            </>
          ) : (
            <div className="px-3 py-2 space-y-1">
              <Link
                href="/auth/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-red-800/20 hover:text-red-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-red-800/20 hover:text-red-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 