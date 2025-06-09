import type { NextRequest } from "next/server"
import { supabase } from "./supabase"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function getUserFromRequest(req: NextRequest) {
  try {
    // Get the token from the request
    const authHeader = req.headers.get("authorization")
    let token: string | undefined

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      // Try to get token from cookie
      const cookieStore = cookies()
      const supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        },
      )

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()
      token = session?.access_token
    }

    if (!token) {
      return null
    }

    // Verify the token and get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error("Error getting user from token:", error)
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
