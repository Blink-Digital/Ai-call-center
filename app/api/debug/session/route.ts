import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get session using the same method as middleware
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Get all cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    return NextResponse.json({
      session: {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at,
        error: sessionError?.message,
      },
      user: {
        exists: !!user,
        userId: user?.id,
        email: user?.email,
        error: userError?.message,
      },
      cookies: allCookies.map((cookie) => ({
        name: cookie.name,
        hasValue: !!cookie.value,
        valueLength: cookie.value?.length || 0,
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
