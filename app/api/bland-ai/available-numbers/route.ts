import { NextResponse } from "next/server"
import { mockPhoneNumbers } from "@/lib/mock-phone-numbers"

export async function GET() {
  try {
    console.log("Fetching available numbers from external API...")

    // Try to fetch from the external API
    const response = await fetch("https://v0-mock-phone-number-api.vercel.app/api/bland-ai/available-numbers", {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    // Check if the response is OK and is JSON
    const contentType = response.headers.get("content-type")
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      console.warn(`API returned non-JSON response: ${response.status} ${response.statusText}`)
      console.log("Using mock data as fallback")

      // Return mock data as fallback
      return NextResponse.json(mockPhoneNumbers)
    }

    // Parse the JSON response
    const data = await response.json()
    console.log("API Response:", JSON.stringify(data, null, 2))

    // Check if the response has a numbers property
    if (data.numbers && Array.isArray(data.numbers)) {
      // Return the data as is
      return NextResponse.json(data)
    } else if (Array.isArray(data)) {
      // If the response is an array directly, wrap it in an object
      return NextResponse.json({ numbers: data })
    } else {
      console.warn("Unexpected API response format, using mock data")
      return NextResponse.json(mockPhoneNumbers)
    }
  } catch (error) {
    console.error("Error fetching available numbers:", error)
    console.log("Using mock data as fallback due to error")

    // Return mock data as fallback
    return NextResponse.json(mockPhoneNumbers)
  }
}
