import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export async function middleware(req: NextRequest) {
  try {
    // Create a response object that can be modified
    const res = NextResponse.next()

    // Create Supabase middleware client with proper cookie handling
    const supabase = createMiddlewareClient<Database>({ req, res })

    // Use getUser() instead of getSession() for reliable auth detection in Edge runtime
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    const pathname = req.nextUrl.pathname
    const isAuthPage = pathname === "/login" || pathname === "/signup"
    const isProtectedRoute = pathname.startsWith("/dashboard")

    // Detailed logging for debugging
    console.log(`🔍 [MIDDLEWARE] Processing: ${pathname}`)
    console.log(`👤 [MIDDLEWARE] User status: ${user ? "✅ Authenticated" : "❌ Not authenticated"}`)

    if (user) {
      console.log(`📧 [MIDDLEWARE] User: ${user.email} (ID: ${user.id})`)
    }

    if (authError) {
      console.log(`⚠️ [MIDDLEWARE] Auth error: ${authError.message}`)
    }

    // RULE 1: Redirect unauthenticated users away from protected routes
    if (!user && isProtectedRoute) {
      console.log(`🔒 [MIDDLEWARE] Blocking unauthenticated access to ${pathname}`)
      console.log(`↩️ [MIDDLEWARE] Redirecting to /login`)

      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // RULE 2: Redirect authenticated users away from auth pages
    if (user && isAuthPage) {
      console.log(`🔄 [MIDDLEWARE] Authenticated user on auth page: ${pathname}`)

      // Check for redirect parameter from login flow
      const redirectTo = req.nextUrl.searchParams.get("redirect") || "/dashboard"
      console.log(`↩️ [MIDDLEWARE] Redirecting authenticated user to: ${redirectTo}`)

      return NextResponse.redirect(new URL(redirectTo, req.url))
    }

    // RULE 3: Allow all other requests to proceed
    console.log(`✅ [MIDDLEWARE] Allowing access to ${pathname}`)
    return res
  } catch (error) {
    // Handle unexpected errors gracefully
    console.error(`🚨 [MIDDLEWARE] Unexpected error on ${req.nextUrl.pathname}:`, error)

    // If error occurs on protected route, redirect to login as fallback
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      console.log(`🔄 [MIDDLEWARE] Error fallback: redirecting to /login`)
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // For non-protected routes, continue normally
    return NextResponse.next()
  }
}

export const config = {
  // Match all routes except static assets, images, and API routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
}
