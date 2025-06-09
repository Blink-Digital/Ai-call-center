// Service for interacting with Bland.ai API
import { toE164Format } from "@/utils/phone-utils"

// Define types for Bland.ai API responses
export interface BlandCall {
  id: string
  to_number: string
  from_number: string
  status: string
  duration: number
  start_time: string
  pathway_id?: string
  pathway_name?: string
  outcome?: string
  recording_url?: string
  transcript?: string
}

export interface BlandCallsResponse {
  calls: BlandCall[]
  total: number
  page: number
  limit: number
}

export interface BlandCallSummary {
  totalCalls: number
  activeFlows: number
  conversionRate: number
  callsThisMonth: number
  callsLastMonth: number
  conversionRateChange: number
  activeFlowsChange: number
}

/**
 * Fetches calls from Bland.ai API for a specific phone number
 */
export async function fetchBlandCalls(phoneNumber: string, page = 1, limit = 100): Promise<BlandCallsResponse> {
  try {
    console.log("📞 Fetching calls for phone number:", phoneNumber)

    // Convert to clean E.164 format for Bland.ai API
    const cleanPhoneNumber = toE164Format(phoneNumber)
    console.log("📞 Clean phone number (E.164):", cleanPhoneNumber)

    // ✅ FIXED: Use to_number instead of from_number
    const url = `/api/bland-ai/proxy/calls?to_number=${encodeURIComponent(cleanPhoneNumber)}&page=${page}&limit=${limit}`
    console.log("🌐 Making request to:", url)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Failed to fetch calls:", response.status, errorText)
      throw new Error(`Failed to fetch calls: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("✅ Received call data:", {
      callsCount: data.calls?.length || 0,
      total: data.total,
      hasError: !!data.error,
    })

    return data
  } catch (error) {
    console.error("💥 Error fetching calls from Bland.ai:", error)
    return { calls: [], total: 0, page, limit }
  }
}

/**
 * Fetches calls for all phone numbers (without filtering by specific number)
 */
export async function fetchAllBlandCalls(page = 1, limit = 1000): Promise<BlandCallsResponse> {
  try {
    console.log("📞 Fetching ALL calls from Bland.ai")

    // Make the API request to Bland.ai without phone number filter
    const url = `/api/bland-ai/proxy/calls?page=${page}&limit=${limit}`
    console.log("🌐 Making request to:", url)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Failed to fetch all calls:", response.status, errorText)
      throw new Error(`Failed to fetch calls: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("✅ Received ALL call data:", {
      callsCount: data.calls?.length || 0,
      total: data.total,
      hasError: !!data.error,
    })

    return data
  } catch (error) {
    console.error("💥 Error fetching all calls from Bland.ai:", error)
    return { calls: [], total: 0, page, limit }
  }
}

/**
 * Fetches call summary data directly from Bland.ai API
 */
export async function fetchCallSummary(phoneNumbers: string[]): Promise<BlandCallSummary> {
  try {
    console.log("📊 Fetching call summary for phone numbers:", phoneNumbers)

    if (!phoneNumbers || phoneNumbers.length === 0) {
      console.log("⚠️ No phone numbers provided, fetching all calls")
      // If no phone numbers, fetch all calls for this account
      const allCallsResult = await fetchAllBlandCalls(1, 1000)
      return calculateCallSummary(allCallsResult.calls)
    }

    // Convert all phone numbers to clean E.164 format
    const cleanPhoneNumbers = phoneNumbers.map(toE164Format)
    console.log("📊 Clean phone numbers:", cleanPhoneNumbers)

    // Fetch calls for all phone numbers
    const callPromises = cleanPhoneNumbers.map((number) => fetchBlandCalls(number, 1, 1000))
    const callResults = await Promise.all(callPromises)

    // Combine all calls into a single array
    const allCalls = callResults.flatMap((result) => result.calls)
    console.log("📊 Combined calls from all numbers:", allCalls.length)

    // Calculate summary metrics
    return calculateCallSummary(allCalls)
  } catch (error) {
    console.error("💥 Error fetching call summary:", error)
    return {
      totalCalls: 0,
      activeFlows: 0,
      conversionRate: 0,
      callsThisMonth: 0,
      callsLastMonth: 0,
      conversionRateChange: 0,
      activeFlowsChange: 0,
    }
  }
}

/**
 * Calculates call summary metrics from Bland.ai call data
 */
export function calculateCallSummary(calls: BlandCall[]): BlandCallSummary {
  console.log("📊 Calculating call summary for", calls.length, "calls")

  // Get current date info for month calculations
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  // Start of current month
  const currentMonthStart = new Date(currentYear, currentMonth, 1)
  // Start of last month
  const lastMonthStart = new Date(lastMonthYear, lastMonth, 1)
  // End of last month
  const lastMonthEnd = new Date(currentYear, currentMonth, 0)

  console.log("📅 Date ranges:", {
    currentMonthStart: currentMonthStart.toISOString(),
    lastMonthStart: lastMonthStart.toISOString(),
    lastMonthEnd: lastMonthEnd.toISOString(),
  })

  // Calculate metrics
  const totalCalls = calls.length

  // Current month calls
  const callsThisMonth = calls.filter((call) => new Date(call.start_time) >= currentMonthStart).length

  // Last month calls
  const callsLastMonth = calls.filter((call) => {
    const callDate = new Date(call.start_time)
    return callDate >= lastMonthStart && callDate <= lastMonthEnd
  }).length

  // Count unique pathway IDs as active flows
  const activeFlowIds = new Set(calls.filter((call) => call.pathway_id).map((call) => call.pathway_id))
  const activeFlows = activeFlowIds.size

  // Calculate conversion rate (successful calls / total calls)
  const successfulCalls = calls.filter(
    (call) => call.status === "completed" && (call.outcome === "successful" || call.duration > 30),
  ).length
  const conversionRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

  // Calculate last month's conversion rate
  const lastMonthSuccessfulCalls = calls.filter((call) => {
    const callDate = new Date(call.start_time)
    return (
      callDate >= lastMonthStart &&
      callDate <= lastMonthEnd &&
      call.status === "completed" &&
      (call.outcome === "successful" || call.duration > 30)
    )
  }).length
  const lastMonthConversionRate = callsLastMonth > 0 ? (lastMonthSuccessfulCalls / callsLastMonth) * 100 : 0

  // Calculate changes
  const conversionRateChange =
    lastMonthConversionRate > 0 ? ((conversionRate - lastMonthConversionRate) / lastMonthConversionRate) * 100 : 0

  const activeFlowsChange = activeFlows > 0 ? 10 : 0 // Placeholder for now

  const summary = {
    totalCalls,
    activeFlows,
    conversionRate,
    callsThisMonth,
    callsLastMonth,
    conversionRateChange,
    activeFlowsChange,
  }

  console.log("📊 Calculated summary:", summary)
  return summary
}

/**
 * Fetches a single call by ID
 */
export async function fetchCallById(callId: string): Promise<BlandCall | null> {
  try {
    const response = await fetch(`/api/bland-ai/proxy/calls/${callId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch call: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching call ${callId}:`, error)
    return null
  }
}
