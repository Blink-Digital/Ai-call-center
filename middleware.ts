import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip middleware for static files and API routes that don't need auth
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.includes(".")
  ) {
    return res
  }

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("[MIDDLEWARE] 🔍 Auth check:", {
      path: req.nextUrl.pathname,
      hasSession: !!session,
      userEmail: session?.user?.email,
    })

    // Only protect /dashboard routes
    const isProtectedPath = req.nextUrl.pathname.startsWith("/dashboard")

    if (isProtectedPath && !session) {
      console.log("[MIDDLEWARE] ❌ Redirecting to login")
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // If user is authenticated and on login page, redirect to dashboard
    if (session && req.nextUrl.pathname === "/login") {
      console.log("[MIDDLEWARE] ✅ Redirecting to dashboard")
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  } catch (error) {
    console.error("[MIDDLEWARE] ❌ Error:", error)
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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
