'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Post } from '@/types/supabase'
import { FiYoutube, FiImage } from 'react-icons/fi'

export default function NewPost() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [formData, setFormData] = useState<Partial<Post>>({
    title: '',
    content: '',
    target_level: 1, // Iniciante por padrão
    youtube_url: '',
    banner_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewBanner, setPreviewBanner] = useState<string | null>(null)

  // Função para extrair o ID do vídeo do YouTube da URL
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[7].length === 11 ? match[7] : null
  }

  // Função para validar a URL do YouTube
  const validateYoutubeUrl = (url: string) => {
    if (!url) return true // URL vazia é válida
    const videoId = getYoutubeVideoId(url)
    return videoId !== null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validar URL do YouTube
      if (formData.youtube_url && !validateYoutubeUrl(formData.youtube_url)) {
        throw new Error('URL do YouTube inválida')
      }

      const { error: supabaseError } = await supabase
        .from('posts')
        .insert([{
          title: formData.title,
          content: formData.content,
          target_level: formData.target_level,
          youtube_url: formData.youtube_url || null,
          banner_url: formData.banner_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (supabaseError) throw supabaseError

      router.push('/admin')
    } catch (err: any) {
      console.error('Erro ao criar post:', err)
      setError(err.message || 'Erro ao criar post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Novo Post</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                Título
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">
                Conteúdo
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input w-full min-h-[200px]"
                required
              />
            </div>

            <div>
              <label htmlFor="youtube_url" className="block text-sm font-medium text-gray-300 mb-1">
                <FiYoutube className="inline-block mr-1" />
                URL do Vídeo do YouTube (opcional)
              </label>
              <input
                id="youtube_url"
                type="url"
                value={formData.youtube_url || ''}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="input w-full"
              />
              {formData.youtube_url && validateYoutubeUrl(formData.youtube_url) && (
                <div className="mt-2 aspect-video">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(formData.youtube_url)}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="banner_url" className="block text-sm font-medium text-gray-300 mb-1">
                <FiImage className="inline-block mr-1" />
                URL do Banner (opcional)
              </label>
              <input
                id="banner_url"
                type="url"
                value={formData.banner_url || ''}
                onChange={(e) => {
                  setFormData({ ...formData, banner_url: e.target.value })
                  setPreviewBanner(e.target.value)
                }}
                placeholder="https://exemplo.com/imagem.jpg"
                className="input w-full"
              />
              {previewBanner && (
                <div className="mt-2 relative aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewBanner}
                    alt="Preview do banner"
                    className="rounded-lg w-full h-full object-cover"
                    onError={() => setPreviewBanner(null)}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="target_level" className="block text-sm font-medium text-gray-300 mb-1">
                Nível Alvo
              </label>
              <select
                id="target_level"
                value={formData.target_level}
                onChange={(e) => setFormData({ ...formData, target_level: Number(e.target.value) })}
                className="input w-full"
                required
              >
                <option value={0}>Todos</option>
                <option value={1}>Iniciante</option>
                <option value={2}>Intermediário</option>
                <option value={3}>Avançado</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Criando...' : 'Criar Post'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
} 