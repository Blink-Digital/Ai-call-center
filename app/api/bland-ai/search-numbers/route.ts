import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const areaCode = url.searchParams.get("areaCode")
    const state = url.searchParams.get("state")

    // Get the API key from environment variables
    const apiKey = process.env.BLAND_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // For now, we'll simulate the API response with mock data
    // In a real implementation, you would call the Bland.ai API to search for numbers

    // Mock data for available numbers
    const mockNumbers = [
      {
        phoneNumber: "+1 (415) 555-1234",
        location: "San Francisco, CA",
        type: "Local",
        monthlyFee: "$1.00",
      },
      {
        phoneNumber: "+1 (212) 555-6789",
        location: "New York, NY",
        type: "Local",
        monthlyFee: "$1.00",
      },
      {
        phoneNumber: "+1 (305) 555-4321",
        location: "Miami, FL",
        type: "Local",
        monthlyFee: "$1.00",
      },
      {
        phoneNumber: "+1 (312) 555-8765",
        location: "Chicago, IL",
        type: "Local",
        monthlyFee: "$1.00",
      },
      {
        phoneNumber: "+1 (617) 555-9876",
        location: "Boston, MA",
        type: "Local",
        monthlyFee: "$1.00",
      },
      {
        phoneNumber: "+1 (713) 555-2345",
        location: "Houston, TX",
        type: "Local",
        monthlyFee: "$1.00",
      },
      {
        phoneNumber: "+1 (206) 555-7890",
        location: "Seattle, WA",
        type: "Local",
        monthlyFee: "$1.00",
      },
      {
        phoneNumber: "+1 (404) 555-3456",
        location: "Atlanta, GA",
        type: "Local",
        monthlyFee: "$1.00",
      },
      {
        phoneNumber: "+1 (702) 555-8901",
        location: "Las Vegas, NV",
        type: "Local",
        monthlyFee: "$1.00",
      },
      {
        phoneNumber: "+1 (303) 555-6543",
        location: "Denver, CO",
        type: "Local",
        monthlyFee: "$1.00",
      },
    ]

    // Filter by area code if provided
    let filteredNumbers = mockNumbers
    if (areaCode) {
      filteredNumbers = mockNumbers.filter((num) => num.phoneNumber.includes(`(${areaCode})`))
    }

    // Filter by state if provided
    if (state) {
      filteredNumbers = filteredNumbers.filter((num) => num.location.endsWith(`, ${state}`))
    }

    return NextResponse.json({
      numbers: filteredNumbers,
    })
  } catch (error) {
    console.error("Error searching numbers:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
