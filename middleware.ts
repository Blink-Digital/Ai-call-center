import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export async function middleware(req: NextRequest) {
  try {
    // Create a response object that can be modified
    const res = NextResponse.next()

    // Create Supabase client bound to the current request/response
    // This properly handles cookies in the Edge runtime
    const supabase = createMiddlewareClient<Database>({ req, res })

    // Use getUser() instead of getSession() for more reliable auth detection
    // getUser() validates the JWT token directly and is more reliable in middleware
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    const pathname = req.nextUrl.pathname
    const isAuthPage = pathname === "/login" || pathname === "/signup"
    const isDashboardRoute = pathname.startsWith("/dashboard")

    // Enhanced logging for debugging
    console.log(`[MIDDLEWARE] ${pathname}`)
    console.log(`[MIDDLEWARE] User: ${user ? "✅ Authenticated" : "❌ Not authenticated"}`)
    if (user) {
      console.log(`[MIDDLEWARE] User ID: ${user.id}, Email: ${user.email}`)
    }
    if (userError) {
      console.log(`[MIDDLEWARE] Auth error:`, userError.message)
    }

    // Redirect unauthenticated users away from protected dashboard routes
    if (!user && isDashboardRoute) {
      console.log(`🔒 [MIDDLEWARE] Redirecting unauthenticated user: ${pathname} → /login`)
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from auth pages
    if (user && isAuthPage) {
      console.log(`🔄 [MIDDLEWARE] Redirecting authenticated user: ${pathname} → /dashboard`)
      const redirectTo = req.nextUrl.searchParams.get("redirect") || "/dashboard"
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }

    // For all other routes, continue normally
    console.log(`✅ [MIDDLEWARE] Allowing access to ${pathname}`)
    return res
  } catch (error) {
    // Handle any unexpected errors gracefully
    console.error(`[MIDDLEWARE] Unexpected error:`, error)

    // If there's an error and user is trying to access dashboard, redirect to login
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      console.log(`🚨 [MIDDLEWARE] Error occurred, redirecting to login`)
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Otherwise, continue normally
    return NextResponse.next()
  }
}

export const config = {
  // Match all routes except:
  // - Static files (_next/static)
  // - Image optimization (_next/image)
  // - Favicon and other public assets
  // - API routes (handled separately)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
