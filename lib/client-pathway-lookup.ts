import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export async function lookupPathwayIdClientSide(phoneNumber: string) {
  try {
    // Early validation
    if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
      console.warn("[CLIENT-LOOKUP] 🚫 Invalid phoneNumber:", phoneNumber)
      return { pathway_id: null, error: "Invalid phone number" }
    }

    console.log("[CLIENT-LOOKUP] 🔍 Looking up pathway for phone:", phoneNumber)

    const supabase = createClientComponentClient<Database>()

    // Get current session with proper error handling
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("[CLIENT-LOOKUP] ❌ Session error:", sessionError)
      return { pathway_id: null, error: "Session error: " + sessionError.message }
    }

    if (!session) {
      console.error("[CLIENT-LOOKUP] ❌ No session found")
      return { pathway_id: null, error: "Auth session missing!" }
    }

    console.log("[CLIENT-LOOKUP] ✅ Session found for user:", session.user.email)

    // Make API call with proper authorization header
    const response = await fetch(`/api/lookup-pathway?phone=${encodeURIComponent(phoneNumber)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[CLIENT-LOOKUP] ❌ API error:", response.status, errorText)
      return {
        pathway_id: null,
        error: `API error: ${response.status} - ${errorText}`,
      }
    }

    const result = await response.json()
    console.log("[CLIENT-LOOKUP] ✅ API response:", result)

    return {
      pathway_id: result.pathway_id || null,
      pathway_name: result.pathway_name || null,
      pathway_description: result.pathway_description || null,
      phone_record: result.phone_record || null,
      error: null,
    }
  } catch (error) {
    console.error("[CLIENT-LOOKUP] ❌ Unexpected error:", error)
    return {
      pathway_id: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Backup direct Supabase method (for cases where API route isn't available)
export async function lookupPathwayIdDirectSupabase(phoneNumber: string) {
  try {
    // Early validation
    if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
      console.warn("[CLIENT-LOOKUP-DIRECT] 🚫 Invalid phoneNumber:", phoneNumber)
      return { pathway_id: null, error: "Invalid phone number" }
    }

    console.log("[CLIENT-LOOKUP-DIRECT] 🔍 Direct Supabase lookup for phone:", phoneNumber)

    const supabase = createClientComponentClient<Database>()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[CLIENT-LOOKUP-DIRECT] ❌ Auth error:", userError?.message || "No user found")
      return { pathway_id: null, error: "Authentication failed" }
    }

    console.log("[CLIENT-LOOKUP-DIRECT] ✅ User authenticated:", user.email)

    // Helper function for phone number normalization
    const normalizePhone = (num: string) => {
      if (!num) return ""
      return num.replace(/\D/g, "")
    }

    // Query database for matching phone number
    const { data, error } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
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
        error: null,
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
