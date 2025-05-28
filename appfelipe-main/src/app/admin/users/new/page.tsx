'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Profile, UserLevel, UserRole } from '@/types/supabase'

export default function NewUser() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    level: 'iniciante' as UserLevel,
    role: 'user' as UserRole,
    platform_id: '',
    points: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (authError) throw authError

      if (authData.user) {
        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: formData.username,
            level: formData.level,
            role: formData.role,
            platform_id: formData.platform_id,
            points: formData.points
          })

        if (profileError) throw profileError

        router.push('/admin/users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Novo Usuário</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Senha:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nome de usuário:</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nível:</label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as UserLevel })}
            className="input"
            required
          >
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Função:</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            className="input"
            required
          >
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ID da Plataforma:</label>
          <input
            type="text"
            value={formData.platform_id}
            onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pontos Iniciais:</label>
          <input
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
            className="input"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Criando...' : 'Criar Usuário'}
        </button>
      </form>
    </div>
  )
}