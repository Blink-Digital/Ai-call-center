import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("[MIDDLEWARE] User check:", {
    hasUser: !!user,
    userEmail: user?.email,
    error: error?.message,
    path: req.nextUrl.pathname,
  })

  // If user is not signed in and the current path is a protected route, redirect the user to /login
  if (!user && req.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("[MIDDLEWARE] Redirecting to login - no user found")
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // If user is signed in and the current path is /login, redirect to /dashboard
  if (user && req.nextUrl.pathname === "/login") {
    console.log("[MIDDLEWARE] Redirecting to dashboard - user already logged in")
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
