// This service will fetch and process call data consistently across the application

export interface CallSummary {
  totalCalls: number
  activeFlows: number
  conversionRate: number
  callsThisMonth: number
  callsLastMonth: number
  conversionRateChange: number
  activeFlowsChange: number
}

export async function fetchCallSummary(phoneNumber?: string, dateRange?: string): Promise<CallSummary> {
  try {
    // Build the query parameters
    const params = new URLSearchParams()
    if (phoneNumber) params.append("phoneNumber", phoneNumber)
    if (dateRange) params.append("dateRange", dateRange)

    // Fetch call data from the API
    const response = await fetch(`/api/bland-ai/call-summary?${params.toString()}`)

    if (!response.ok) {
      throw new Error("Failed to fetch call summary data")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching call summary:", error)
    // Return default values in case of error
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

export async function fetchUserPhoneNumbers() {
  try {
    const response = await fetch("/api/bland-ai/user-phone-numbers")

    if (!response.ok) {
      throw new Error("Failed to fetch user phone numbers")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching user phone numbers:", error)
    return []
  }
}

export async function fetchRecentCallFlows(limit = 3) {
  try {
    const response = await fetch(`/api/bland-ai/recent-call-flows?limit=${limit}`)

    if (!response.ok) {
      throw new Error("Failed to fetch recent call flows")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching recent call flows:", error)
    return []
  }
}
