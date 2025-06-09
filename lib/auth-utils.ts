import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function getUserFromRequest(req: NextRequest) {
  try {
    // Create a proper server client that handles cookies automatically
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set() {
            // Not needed for read-only operations
          },
          remove() {
            // Not needed for read-only operations
          },
        },
      },
    )

    // Let Supabase handle the session parsing
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      console.error("Error getting user from request:", error)
      return null
    }

    // Get additional user data from the database
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError) {
      console.error("Error getting user data:", userError)
      // Return basic user info if we can't get the full profile
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        role: "user",
      }
    }

    return userData
  } catch (error) {
    console.error("Error in getUserFromRequest:", error)
    return null
  }
}
