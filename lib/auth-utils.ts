import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// ✅ FIXED: Get user from server-side request (for API routes) with proper cookie handling
export async function getUserFromRequest() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Auth error:", error.message)
      return null
    }

    return user
  } catch (error) {
    console.error("Failed to get user from request:", error)
    return null
  }
}

// Check if user is authenticated (for API routes)
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUserFromRequest()
  return !!user
}

// Get user ID from server-side request (for API routes)
export async function getUserId(): Promise<string | null> {
  const user = await getUserFromRequest()
  return user?.id || null
}

// ✅ NEW: Get user with detailed error information
export async function getUserWithError() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    return { user, error }
  } catch (error) {
    console.error("Failed to get user from request:", error)
    return {
      user: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    }
  }
}
