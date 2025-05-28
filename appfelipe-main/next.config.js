/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['gfgtabtnjlntsbmylniu.supabase.co', 'i.imgur.com'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Configurações para otimizar o build
  output: 'standalone',
  experimental: {
    // Desativa a geração estática para páginas que precisam de dados dinâmicos
    workerThreads: false,
    cpus: 1
  },
  // Adiciona a pasta public como diretório estático
  webpack(config) {
    return config
  },
}

module.exports = nextConfig 