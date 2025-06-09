import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export async function lookupPathwayIdClientSide(phoneNumber: string) {
  try {
    console.log("[CLIENT-LOOKUP] 🔍 Looking up pathway for phone:", phoneNumber)

    // Create Supabase client for client components
    const supabase = createClientComponentClient<Database>()

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("[CLIENT-LOOKUP] ❌ Session error:", sessionError.message)
      return {
        pathway_id: null,
        error: `Session error: ${sessionError.message}`,
      }
    }

    if (!session) {
      console.error("[CLIENT-LOOKUP] ❌ No session found")
      return {
        pathway_id: null,
        error: "No active session. Please log in again.",
      }
    }

    console.log("[CLIENT-LOOKUP] ✅ Session found for user:", session.user.email)

    // Make authenticated request to API route
    // The Supabase auth helpers will automatically include the session cookie
    const response = await fetch(`/api/lookup-pathway?phone=${encodeURIComponent(phoneNumber)}`, {
      method: "GET",
      credentials: "include", // Important: include cookies
      headers: {
        "Content-Type": "application/json",
        // Don't manually add Authorization header - let Supabase handle it via cookies
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("[CLIENT-LOOKUP] ❌ API error:", response.status, errorData)
      return {
        pathway_id: null,
        error: errorData.error || `HTTP ${response.status}`,
      }
    }

    const result = await response.json()
    console.log("[CLIENT-LOOKUP] ✅ API response:", result)

    return {
      pathway_id: result.pathway_id || null,
      pathway_name: result.pathway_name || null,
      pathway_description: result.pathway_description || null,
      phone_record: result.phone_record || null,
      error: result.error || null,
    }
  } catch (error) {
    console.error("[CLIENT-LOOKUP] ❌ Unexpected error:", error)
    return {
      pathway_id: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
