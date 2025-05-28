import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Criar uma resposta que pode ser modificada
  const res = NextResponse.next()

  // Criar o cliente do Supabase
  const supabase = createMiddlewareClient({ req: request, res })

  // Verificar se há uma sessão válida
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rotas que requerem autenticação
  const protectedRoutes = ['/dashboard', '/perfil', '/store', '/ranking']
  const adminRoutes = ['/admin']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Se não houver sessão e a rota for protegida, redirecionar para login
  if (!session) {
    if (isProtectedRoute || isAdminRoute) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return res
  }

  // Se houver sessão, verificar permissões para rotas administrativas
  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/perfil/:path*',
    '/admin/:path*',
    '/store/:path*',
    '/ranking/:path*',
    '/auth/login',
    '/auth/register',
    '/auth/callback'
  ]
} 