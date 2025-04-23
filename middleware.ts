import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // We need to create a response and hand it to the supabase client to be able to modify the response headers.
  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const { data: { session } } = await supabase.auth.getSession()

  // If the user is not logged in and tries to access protected routes,
  // redirect them to the /auth page.
  // Define your protected routes here.
  const protectedRoutes = ['/dashboard', '/profile'] // Add any other routes that need protection

  if (!session && protectedRoutes.some(path => req.nextUrl.pathname.startsWith(path))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname) // Optional: Let auth page know where user came from
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is logged in and tries to access the auth page,
  // redirect them to the dashboard.
  if (session && req.nextUrl.pathname === '/auth') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more exceptions.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
} 