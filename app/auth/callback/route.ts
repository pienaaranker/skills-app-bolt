import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // Create a response object for the redirect
    const response = NextResponse.redirect(`${origin}${next}`)

    // Create Supabase client using request and response cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.delete({ name, ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Return the response with updated cookies
      return response
    }
  }

  // return the user to an error page with instructions
  // TODO: Create a proper auth error page
  console.error('Auth callback error: No code or exchange failed');
  const errorResponse = NextResponse.redirect(`${origin}/auth/auth-code-error`)
  // Optionally add error details to the response if needed, e.g., via headers or search params
  return errorResponse
}