import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip auth check if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isCallbackRoute = request.nextUrl.pathname === '/auth/callback'
  const isResetPasswordRoute = request.nextUrl.pathname === '/auth/reset-password'
  const isDocsRoute = request.nextUrl.pathname.startsWith('/docs')
  const isMcpApiRoute = request.nextUrl.pathname.startsWith('/api/mcp')

  // Allow callback route without session
  if (isCallbackRoute) {
    return supabaseResponse
  }

  // Allow reset-password page even when authenticated (for password recovery flow)
  if (isResetPasswordRoute) {
    return supabaseResponse
  }

  // Allow docs pages without authentication (public documentation)
  if (isDocsRoute) {
    return supabaseResponse
  }

  // Allow MCP API routes (they use API key authentication, not session)
  if (isMcpApiRoute) {
    return supabaseResponse
  }

  // Redirect authenticated users away from other auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to login
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
