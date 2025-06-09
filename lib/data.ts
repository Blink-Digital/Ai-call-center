import { createServerClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

/**
 * Fetches call summary data for a specific user's phone numbers
 * @param userId The ID of the user to fetch data for
 * @returns Summary of call data including total calls, average duration, etc.
 */
export async function fetchCallSummary(userId: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // First, get the user's phone numbers
    const { data: phoneNumbers, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("phone_number")
      .eq("user_id", userId)

    if (phoneError) {
      console.error("Error fetching user phone numbers:", phoneError)
      return {
        totalCalls: 0,
        averageDuration: 0,
        successRate: 0,
        recentCalls: [],
      }
    }

    if (!phoneNumbers || phoneNumbers.length === 0) {
      // User has no phone numbers, return empty data
      return {
        totalCalls: 0,
        averageDuration: 0,
        successRate: 0,
        recentCalls: [],
      }
    }

    // Extract just the phone number strings
    const phoneNumberStrings = phoneNumbers.map((p) => p.phone_number)

    // Fetch call data for these phone numbers
    const { data: calls, error: callsError } = await supabase
      .from("calls")
      .select("*")
      .in("phone_number", phoneNumberStrings)
      .order("created_at", { ascending: false })

    if (callsError) {
      console.error("Error fetching calls:", callsError)
      return {
        totalCalls: 0,
        averageDuration: 0,
        successRate: 0,
        recentCalls: [],
      }
    }

    // Calculate summary statistics
    const totalCalls = calls.length
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0)
    const averageDuration = totalCalls > 0 ? totalDuration / totalCalls : 0
    const successfulCalls = calls.filter((call) => call.status === "completed").length
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

    // Get the 5 most recent calls
    const recentCalls = calls.slice(0, 5)

    return {
      totalCalls,
      averageDuration,
      successRate,
      recentCalls,
    }
  } catch (error) {
    console.error("Error in fetchCallSummary:", error)
    return {
      totalCalls: 0,
      averageDuration: 0,
      successRate: 0,
      recentCalls: [],
    }
  }
}

/**
 * Fetches recent call flows for a specific user
 * @param userId The ID of the user to fetch data for
 * @param limit Maximum number of flows to return
 * @returns Array of recent call flows
 */
export async function fetchRecentCallFlows(userId: string, limit = 5) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Fetch the user's pathways
    const { data: pathways, error: pathwaysError } = await supabase
      .from("pathways")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (pathwaysError) {
      console.error("Error fetching pathways:", pathwaysError)
      return []
    }

    return pathways || []
  } catch (error) {
    console.error("Error in fetchRecentCallFlows:", error)
    return []
  }
}
