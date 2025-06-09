import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"

// Format phone number to E.164 format
function formatToE164(input: string): string {
  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, "")

  // Ensure it has the country code
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}` // Add US country code if not present
  } else if (digitsOnly.length > 10 && !digitsOnly.startsWith("1")) {
    return `+1${digitsOnly}` // Add + if missing but has country code
  } else if (digitsOnly.length > 10 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}` // Add + if missing and has country code
  }

  // If already in E.164 format or close enough, just ensure it has +
  return input.startsWith("+") ? input : `+${input}`
}

export async function POST(request: Request) {
  try {
    const { phoneNumber, country = "US", userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get the API key from environment variables
    const apiKey = process.env.BLAND_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Format the phone number to E.164 format
    const formattedNumber = formatToE164(phoneNumber)

    console.log(`Purchasing number: ${formattedNumber} for country: ${country}`)

    // Call the Bland.ai API to purchase the number
    const response = await fetch("https://api.bland.ai/v1/inbound/purchase", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: formattedNumber,
        country: country,
      }),
    })

    // Log the response for debugging
    const responseText = await response.text()
    console.log(`Bland.ai API response: ${responseText}`)

    let data
    try {
      // Try to parse the response as JSON
      data = JSON.parse(responseText)
    } catch (e) {
      // If parsing fails, return the raw response text
      return NextResponse.json({ error: `Failed to parse API response: ${responseText}` }, { status: 500 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Failed to purchase number" }, { status: response.status })
    }

    // If the purchase was successful, save the number to the database
    try {
      const supabase = createServiceClient()

      // Insert the purchased number into the phone_numbers table
      const { error: insertError } = await supabase.from("phone_numbers").insert({
        user_id: userId,
        number: formattedNumber,
        status: "active",
        type: "voice",
        location: country === "US" ? "United States" : country,
        purchased_at: new Date().toISOString(),
        monthly_fee: data.monthly_fee || 0,
      })

      if (insertError) {
        console.error("Error saving phone number to database:", insertError)
        // Continue with the response even if DB insert fails, but log the error
      } else {
        console.log("Successfully saved phone number to database")
      }
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Continue with the response even if DB operation fails, but log the error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error purchasing number:", error)
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
