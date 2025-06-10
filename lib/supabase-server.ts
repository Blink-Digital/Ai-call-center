import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// For use in API routes
export function createSupabaseServer() {
  return createRouteHandlerClient<Database>({ cookies })
}

// Helper function to get user on server (for API routes)
export async function getServerUser() {
  try {
    const supabase = createSupabaseServer()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting server user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Failed to create server client:", error)
    return null
  }
}

// Add this export for backward compatibility
export { createSupabaseServer as createServerClient }
