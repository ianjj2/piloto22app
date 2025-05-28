'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiLock } from 'react-icons/fi'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success('Senha redefinida com sucesso!')
      router.push('/auth/login')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
      <Image
        src="/assets/Fundo.jpg"
        alt="Background"
        fill
        sizes="100vw"
        className="object-cover"
        quality={100}
        priority
      />
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#1a0808]/90 border border-red-800 backdrop-blur-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-48 h-24 mb-4 relative">
            <Image
              src="/assets/Logo.png"
              alt="Logo"
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-contain"
              priority
            />
          </div>
          <p className="text-red-500 mt-1">Redefinir senha</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#2a1010]/90 border border-red-800/50 rounded-lg text-white placeholder-red-500/50 focus:outline-none focus:border-red-500 transition-colors"
                placeholder="Nova senha"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>

        <p className="text-center mt-6 text-red-500">
          <a href="/auth/login" className="hover:text-red-400 transition-colors">
            Voltar para o login
          </a>
        </p>
      </div>
    </main>
  )
} 
