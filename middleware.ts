import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value)
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    // ✅ Get both session and user for better detection
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isAuthenticated = !!(session && user && !sessionError && !userError)

    console.log(`[MIDDLEWARE] ${pathname} - Session: ${session ? "✅" : "❌"}, User: ${user ? "✅" : "❌"}`)

    if (sessionError || userError) {
      console.warn(`[MIDDLEWARE] Auth errors - Session: ${sessionError?.message}, User: ${userError?.message}`)
    }

    // Protect dashboard routes
    if (pathname.startsWith("/dashboard")) {
      if (!isAuthenticated) {
        console.log(`🔒 [MIDDLEWARE] No auth, redirecting ${pathname} → /login`)
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(redirectUrl)
      }
      console.log(`✅ [MIDDLEWARE] User authenticated for ${pathname}`)
    }

    // Redirect authenticated users away from auth pages
    if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
      console.log(`🔄 [MIDDLEWARE] Authenticated user on ${pathname}, redirecting to /dashboard`)
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return supabaseResponse
  } catch (error) {
    console.error("[MIDDLEWARE] Unexpected error:", error)
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
