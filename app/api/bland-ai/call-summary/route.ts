import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies for authentication
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get the phone number IDs from the query parameters
    const { searchParams } = new URL(request.url)
    const phoneNumberIds = searchParams.get("phoneNumberIds")

    if (!phoneNumberIds) {
      return NextResponse.json({
        data: {
          totalCalls: 0,
          activeFlows: 0,
          conversionRate: 0,
          callsThisMonth: 0,
          callsLastMonth: 0,
          conversionRateChange: 0,
          activeFlowsChange: 0,
        },
      })
    }

    // Verify that the requested phone numbers belong to the user
    const { data: phoneNumbers, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("id, phone_number")
      .eq("user_id", userId)
      .in("id", phoneNumberIds.split(","))

    if (phoneError) {
      console.error("Error fetching phone numbers:", phoneError)
      return NextResponse.json({
        data: {
          totalCalls: 0,
          activeFlows: 0,
          conversionRate: 0,
          callsThisMonth: 0,
          callsLastMonth: 0,
          conversionRateChange: 0,
          activeFlowsChange: 0,
        },
      })
    }

    if (!phoneNumbers || phoneNumbers.length === 0) {
      return NextResponse.json({
        data: {
          totalCalls: 0,
          activeFlows: 0,
          conversionRate: 0,
          callsThisMonth: 0,
          callsLastMonth: 0,
          conversionRateChange: 0,
          activeFlowsChange: 0,
        },
      })
    }

    // Get current date info for month calculations
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Start of current month
    const currentMonthStart = new Date(currentYear, currentMonth, 1).toISOString()
    // Start of last month
    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1).toISOString()
    // End of last month
    const lastMonthEnd = new Date(currentYear, currentMonth, 0).toISOString()

    // Check if call_logs table exists
    const { error: tableCheckError } = await supabase.from("call_logs").select("count").limit(1).single()

    // If call_logs table doesn't exist, return zeros
    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      console.log("call_logs table does not exist, returning zeros")
      return NextResponse.json({
        data: {
          totalCalls: 0,
          activeFlows: 0,
          conversionRate: 0,
          callsThisMonth: 0,
          callsLastMonth: 0,
          conversionRateChange: 0,
          activeFlowsChange: 0,
        },
      })
    }

    // Get the phone numbers as an array
    const phoneNumbersArray = phoneNumbers.map((pn) => pn.phone_number)

    // Fetch call data for the verified phone numbers from call_logs table
    const { data: calls, error: callsError } = await supabase
      .from("call_logs")
      .select("*")
      .in("phone_number", phoneNumbersArray)

    if (callsError) {
      console.error("Error fetching calls:", callsError)
      return NextResponse.json({
        data: {
          totalCalls: 0,
          activeFlows: 0,
          conversionRate: 0,
          callsThisMonth: 0,
          callsLastMonth: 0,
          conversionRateChange: 0,
          activeFlowsChange: 0,
        },
      })
    }

    // Calculate metrics
    const totalCalls = calls ? calls.length : 0

    // Current month calls
    const callsThisMonth = calls ? calls.filter((call) => call.created_at >= currentMonthStart).length : 0

    // Last month calls
    const callsLastMonth = calls
      ? calls.filter((call) => call.created_at >= lastMonthStart && call.created_at <= lastMonthEnd).length
      : 0

    // Get active flows (pathways)
    const { data: activeFlows, error: flowsError } = await supabase
      .from("pathways")
      .select("id")
      .eq("creator_id", userId)
      .eq("status", "active")

    if (flowsError && !flowsError.message.includes("does not exist")) {
      console.error("Error fetching active flows:", flowsError)
    }

    // Get previous month's active flows for comparison
    let previousActiveFlows = 0
    try {
      const { data: lastMonthFlows } = await supabase
        .from("pathway_history")
        .select("count")
        .eq("user_id", userId)
        .eq("month", lastMonth)
        .eq("year", lastMonthYear)
        .single()

      if (lastMonthFlows) {
        previousActiveFlows = lastMonthFlows.count
      }
    } catch (error) {
      // Ignore errors for pathway_history table
      console.log("Error fetching pathway history, using 0:", error)
    }

    const currentActiveFlows = activeFlows ? activeFlows.length : 0

    // Calculate conversion rate (example: successful calls / total calls)
    const successfulCalls = calls
      ? calls.filter((call) => call.status === "completed" && call.outcome === "successful").length
      : 0

    const conversionRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

    // Get previous month's conversion rate
    const lastMonthSuccessfulCalls = calls
      ? calls.filter(
          (call) =>
            call.created_at >= lastMonthStart &&
            call.created_at <= lastMonthEnd &&
            call.status === "completed" &&
            call.outcome === "successful",
        ).length
      : 0

    const lastMonthConversionRate = callsLastMonth > 0 ? (lastMonthSuccessfulCalls / callsLastMonth) * 100 : 0

    // Calculate changes
    const conversionRateChange =
      lastMonthConversionRate > 0 ? ((conversionRate - lastMonthConversionRate) / lastMonthConversionRate) * 100 : 0

    const activeFlowsChange =
      previousActiveFlows > 0 ? ((currentActiveFlows - previousActiveFlows) / previousActiveFlows) * 100 : 0

    // Return the calculated metrics
    return NextResponse.json({
      data: {
        totalCalls,
        activeFlows: currentActiveFlows,
        conversionRate,
        callsThisMonth,
        callsLastMonth,
        conversionRateChange,
        activeFlowsChange,
      },
    })
  } catch (error) {
    console.error("Error in call summary API:", error)
    return NextResponse.json({
      data: {
        totalCalls: 0,
        activeFlows: 0,
        conversionRate: 0,
        callsThisMonth: 0,
        callsLastMonth: 0,
        conversionRateChange: 0,
        activeFlowsChange: 0,
      },
    })
  }
}
