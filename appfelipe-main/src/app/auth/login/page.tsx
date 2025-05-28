'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Por favor, insira seu email')
      return
    }

    setIsVerifying(true)
    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      setShowVerificationMessage(true)
      toast.success('Email de verificação reenviado! Por favor, verifique sua caixa de entrada.')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error('Por favor, insira seu email')
      return
    }

    setIsResettingPassword(true)
    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast.success('Email de recuperação enviado! Por favor, verifique sua caixa de entrada.')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setShowVerificationMessage(true)
          return
        }
        throw error
      }

      router.push(redirectTo)
      router.refresh()
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
      <div className="w-full max-w-md p-8 rounded-3xl bg-[#1a0808]/80 border border-red-800 shadow-2xl backdrop-blur-lg relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-48 h-24 mb-4 relative">
            <Image
              src="/assets/Logo.png"
              alt="Logo"
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          <p className="text-red-400 mt-1 font-semibold tracking-wide">Acesse sua conta</p>
        </div>

        {showVerificationMessage ? (
          <div className="mb-8">
            <div className="bg-[#2a1010] border border-red-800 rounded-lg p-4 mb-4">
              <p className="text-white font-medium mb-2">
                Email não verificado. Por favor, verifique seu email ou solicite um novo email de verificação.
              </p>
              <p className="text-gray-300 text-sm mb-4">
                Aguarde nossa equipe fazer sua liberação. Fique atento ao seu email, a qualquer momento podemos enviar uma confirmação.
              </p>
              <button
                onClick={handleResendEmail}
                disabled={isVerifying}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isVerifying ? 'Enviando...' : 'Enviar para análise'}
              </button>
            </div>
            <button
              onClick={() => setShowVerificationMessage(false)}
              className="w-full py-2 text-red-400 hover:text-red-300 transition-colors text-sm"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a1010]/80 border border-red-800/50 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm"
                  placeholder="Seu email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#2a1010]/80 border border-red-800/50 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-200 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isResettingPassword}
                className="mt-2 text-sm text-red-300 hover:text-red-200 transition-colors"
              >
                {isResettingPassword ? 'Enviando...' : 'Esqueceu sua senha?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:scale-[1.03] hover:shadow-lg text-white rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 shadow-md"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-red-400">
          <a href="/auth/register" className="hover:text-red-200 transition-colors font-medium">
            Não tem uma conta? Cadastre-se
          </a>
        </p>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>
    </main>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
} 
