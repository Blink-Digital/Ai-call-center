import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  console.log("[MIDDLEWARE] 🔍 Request details:", {
    path: req.nextUrl.pathname,
    method: req.method,
    userAgent: req.headers.get("user-agent")?.slice(0, 50),
    cookies: req.cookies.getAll().map((c) => ({ name: c.name, hasValue: !!c.value })),
  })

  try {
    // ✅ CRITICAL: Use getUser() instead of getSession() for middleware
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("[MIDDLEWARE] 🔍 Auth check result:", {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      error: error?.message,
      path: req.nextUrl.pathname,
    })

    // Protected routes that require authentication
    const protectedPaths = ["/dashboard"]
    const isProtectedPath = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))

    if (isProtectedPath && !user) {
      console.log("[MIDDLEWARE] ❌ Redirecting unauthenticated user to login")
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access login, redirect to dashboard
    if (user && req.nextUrl.pathname === "/login") {
      console.log("[MIDDLEWARE] ✅ Redirecting authenticated user to dashboard")
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    console.log("[MIDDLEWARE] ✅ Request allowed to proceed")
    return res
  } catch (middlewareError) {
    console.error("[MIDDLEWARE] ❌ Unexpected error:", middlewareError)
    // On error, allow the request to proceed to avoid breaking the app
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
