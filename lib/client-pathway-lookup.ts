import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export async function lookupPathwayIdClientSide(phoneNumber: string) {
  try {
    console.log("[CLIENT-LOOKUP] 🔍 Looking up pathway for phone:", phoneNumber)

    const supabase = createClientComponentClient<Database>()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[CLIENT-LOOKUP] ❌ Auth error:", userError?.message || "No user found")
      return { pathway_id: null, error: "Authentication failed" }
    }

    console.log("[CLIENT-LOOKUP] ✅ User authenticated:", user.email)

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
      console.error("[CLIENT-LOOKUP] ❌ Database error:", error)
      return { pathway_id: null, error: error.message }
    }

    if (!data || data.length === 0) {
      console.log("[CLIENT-LOOKUP] ❌ No phone numbers found for user")
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
      console.log("[CLIENT-LOOKUP] 🎯 MATCHING PHONE FOUND:", {
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
      console.log("[CLIENT-LOOKUP] ❌ No matching phone number found")
      return { pathway_id: null, error: "No matching phone number found" }
    }
  } catch (error) {
    console.error("[CLIENT-LOOKUP] ❌ Unexpected error:", error)
    return {
      pathway_id: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
