import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export async function lookupPathwayIdClientSide(phoneNumber: string) {
  if (!phoneNumber || phoneNumber === "undefined") {
    console.warn("🚫 Invalid phoneNumber passed to lookup:", phoneNumber)
    return {
      pathway_id: null,
      error: "Invalid phone number",
    }
  }

  try {
    console.log("[CLIENT-LOOKUP] 🔍 Looking up pathway for phone:", phoneNumber)
    const supabase = createClientComponentClient<Database>()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("[CLIENT-LOOKUP] ❌ Session error or not found")
      return { pathway_id: null, error: "No session" }
    }

    const response = await fetch(`/api/lookup-pathway?phone=${encodeURIComponent(phoneNumber)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        pathway_id: null,
        error: errorData?.error || `HTTP ${response.status}`,
      }
    }

    const result = await response.json()
    return {
      pathway_id: result.pathway_id || null,
      pathway_name: result.pathway_name || null,
      pathway_description: result.pathway_description || null,
      phone_record: result.phone_record || null,
      error: null,
    }
  } catch (error) {
    return {
      pathway_id: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
