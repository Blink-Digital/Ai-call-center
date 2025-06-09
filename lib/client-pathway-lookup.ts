import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export async function lookupPathwayIdClientSide(phoneNumber: string) {
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

// Backup direct Supabase method (for cases where API route isn't available)
export async function lookupPathwayIdDirectSupabase(phoneNumber: string) {
  try {
    console.log("[CLIENT-LOOKUP-DIRECT] 🔍 Direct Supabase lookup for phone:", phoneNumber)

    const supabase = createClientComponentClient<Database>()

    // Get current session with retry logic
    let session = null
    let retryCount = 0
    const maxRetries = 3

    while (!session && retryCount < maxRetries) {
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("[CLIENT-LOOKUP-DIRECT] ❌ Session error:", sessionError)
        retryCount++
        await new Promise((resolve) => setTimeout(resolve, 100 * retryCount)) // Exponential backoff
        continue
      }

      session = currentSession
      break
    }

    if (!session) {
      console.error("[CLIENT-LOOKUP-DIRECT] ❌ No session found after retries")
      return { pathway_id: null, error: "Authentication session not found" }
    }

    console.log("[CLIENT-LOOKUP-DIRECT] ✅ Session found:", session.user.email)

    // Helper function for phone number normalization
    const normalizePhone = (num: string) => {
      if (!num) return ""
      return num.replace(/\D/g, "")
    }

    // Query database for matching phone number
    const { data, error } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", session.user.id)
      .in("status", ["active", "purchased"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[CLIENT-LOOKUP-DIRECT] ❌ Database error:", error)
      return { pathway_id: null, error: error.message }
    }

    if (!data || data.length === 0) {
      console.log("[CLIENT-LOOKUP-DIRECT] ❌ No phone numbers found for user")
      return { pathway_id: null, error: "No phone numbers found" }
    }

    // Find matching phone number with enhanced matching logic
    const targetNormalized = normalizePhone(phoneNumber)
    let matchingPhone = null

    for (const phone of data) {
      // 1. Exact match
      if (phone.number === phoneNumber) {
        matchingPhone = phone
        break
      }

      // 2. Normalized match
      const storedNormalized = normalizePhone(phone.number)
      if (targetNormalized === storedNormalized) {
        matchingPhone = phone
        break
      }

      // 3. Country code variations
      if (targetNormalized.length === 10 && storedNormalized === `1${targetNormalized}`) {
        matchingPhone = phone
        break
      }

      if (storedNormalized.length === 10 && targetNormalized === `1${storedNormalized}`) {
        matchingPhone = phone
        break
      }
    }

    if (matchingPhone) {
      console.log("[CLIENT-LOOKUP-DIRECT] 🎯 MATCHING PHONE FOUND:", {
        number: matchingPhone.number,
        pathway_id: matchingPhone.pathway_id,
      })

      return {
        pathway_id: matchingPhone.pathway_id || null,
        pathway_name: matchingPhone.pathway_name || null,
        pathway_description: matchingPhone.pathway_description || null,
        phone_record: matchingPhone,
      }
    } else {
      console.log("[CLIENT-LOOKUP-DIRECT] ❌ No matching phone number found")
      return { pathway_id: null, error: "No matching phone number found" }
    }
  } catch (error) {
    console.error("[CLIENT-LOOKUP-DIRECT] ❌ Unexpected error:", error)
    return {
      pathway_id: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
