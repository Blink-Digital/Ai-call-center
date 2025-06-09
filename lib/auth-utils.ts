import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Get user from server-side request (for API routes)
export async function getUserFromRequest() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

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
