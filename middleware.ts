import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export async function middleware(req: NextRequest) {
  // Create a response object that can be modified
  const res = NextResponse.next()

  // Create Supabase client bound to the current request/response
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Get the current user (this is more reliable than getSession in middleware)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname

  console.log(`[MIDDLEWARE] ${pathname} - User: ${user ? "✅" : "❌"} ${user?.email || ""}`)

  // Redirect unauthenticated users away from protected dashboard routes
  if (!user && pathname.startsWith("/dashboard")) {
    console.log(`🔒 [MIDDLEWARE] No auth, redirecting ${pathname} → /login`)
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname === "/login" || pathname === "/signup")) {
    console.log(`🔄 [MIDDLEWARE] Authenticated user on ${pathname}, redirecting to /dashboard`)
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
