'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import InputMask from 'react-input-mask'

function RegisterForm() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    phone: '',
    level: 1,
    platformId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validar telefone
    const phoneNumber = formData.phone.replace(/\D/g, '')
    if (phoneNumber.length < 11) {
      setError('Por favor, insira um número de telefone válido')
      setLoading(false)
      return
    }

    try {
      // 1. Criar usuário no Auth
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.username,
            phone: formData.phone,
            level: formData.level,
            platform_id: formData.platformId || null
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) {
        console.error('Erro no registro:', signUpError)
        throw signUpError
      }

      if (!user) {
        throw new Error('Erro ao criar usuário')
      }

      // 2. Criar perfil manualmente caso o trigger falhe
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            username: formData.username,
            phone: formData.phone,
            level: formData.level,
            platform_id: formData.platformId || null,
            points: 0,
            role: 'user'
          }
        ])
        .single()

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError)
        // Não lançamos o erro aqui pois o perfil pode já ter sido criado pelo trigger
      }

      // 3. Mostrar mensagem de sucesso e redirecionar
      toast.success('Email de verificação enviado! Por favor, verifique sua caixa de entrada.')
      router.push('/auth/login')
    } catch (err: any) {
      console.error('Erro no registro:', err)
      setError(err.message || 'Erro ao criar conta')
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
          <p className="text-red-400 mt-1 font-semibold tracking-wide">Crie sua conta</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-red-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#2a1010]/80 border border-red-800/50 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm"
              placeholder="Seu email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-red-400 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-[#2a1010]/80 border border-red-800/50 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm"
              placeholder="Sua senha"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-red-400 mb-1">
              Nome de usuário
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 bg-[#2a1010]/80 border border-red-800/50 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm"
              placeholder="Seu nome de usuário"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-red-400 mb-1">
              Telefone
            </label>
            <InputMask
              mask="(99) 99999-9999"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-[#2a1010]/80 border border-red-800/50 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm"
              placeholder="(00) 00000-0000"
              required
            >
              {(inputProps: any) => <input {...inputProps} type="tel" id="phone" />}
            </InputMask>
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-red-400 mb-1">
              Nível de conhecimento
            </label>
            <select
              id="level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-[#2a1010]/80 border border-red-800/50 rounded-xl text-white focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm"
              required
            >
              <option value={1}>Iniciante</option>
              <option value={2}>Intermediário</option>
              <option value={3}>Avançado</option>
            </select>
          </div>

          <div>
            <label htmlFor="platformId" className="block text-sm font-medium text-red-400 mb-1">
              ID da plataforma (opcional)
            </label>
            <input
              id="platformId"
              type="text"
              value={formData.platformId}
              onChange={(e) => setFormData({ ...formData, platformId: e.target.value })}
              className="w-full px-4 py-3 bg-[#2a1010]/80 border border-red-800/50 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-2 focus:border-red-500 transition-all duration-200 shadow-sm"
              placeholder="ID da plataforma"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:scale-[1.03] hover:shadow-lg text-white rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 shadow-md"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-red-400">
          Já tem uma conta?{' '}
          <a href="/auth/login" className="text-red-200 hover:underline font-medium transition-colors">
            Entrar
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

export default function Register() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RegisterForm />
    </Suspense>
  )
} 