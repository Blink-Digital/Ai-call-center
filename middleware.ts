import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("[MIDDLEWARE] Session check:", {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    userEmail: session?.user?.email,
  })

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard", "/api/lookup-pathway", "/api/phone-numbers", "/api/pathways", "/api/teams"]

  const isProtectedPath = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !session) {
    console.log("[MIDDLEWARE] ❌ Redirecting unauthenticated user to login")
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
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
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
