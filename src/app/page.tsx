import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Bem-vindo ao Piloto Aviator APP</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/ranking" className="card hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">🏆 Ranking</h2>
            <p className="text-gray-600">Veja o ranking dos usuários e sua posição.</p>
          </Link>

          <Link href="/app" className="card hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">📱 App</h2>
            <p className="text-gray-600">Acesse o app e comece a jogar.</p>
          </Link>

          <Link href="/auth/login" className="card hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">🔐 Entrar</h2>
            <p className="text-gray-600">Faça login para acessar sua conta.</p>
          </Link>
        </div>
      </div>
    </main>
  )
} 