import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { data: { session } } = await supabase.auth.getSession()

  // If the user is not logged in and tries to access protected routes,
  // redirect them to the /auth page.
  const protectedRoutes = ['/dashboard', '/profile', '/new-skill', '/skills', '/curriculum'] // Added other potential protected routes
  const publicRoutes = ['/auth', '/'] // Routes accessible without login

  const isProtectedRoute = protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path))
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)

  if (!session && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set(`redirectedFrom`, request.nextUrl.pathname) // Optional
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is logged in and tries to access the auth page or landing page,
  // redirect them to the dashboard.
  if (session && (request.nextUrl.pathname === '/auth' || request.nextUrl.pathname === '/')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
  }

  return response
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - these should handle their own auth or rely on middleware session)
     * Feel free to modify this pattern to include more exceptions.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
} 