import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { phoneNumber, subscriptionId, country = "US" } = await request.json()

    // Get the API key from environment variables
    const apiKey = process.env.BLAND_AI_API_KEY
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET

    if (!apiKey) {
      return NextResponse.json({ error: "Bland AI API key not configured" }, { status: 500 })
    }

    if (!paypalClientId || !paypalClientSecret) {
      return NextResponse.json({ error: "PayPal credentials not configured" }, { status: 500 })
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 })
    }

    // Verify the subscription with PayPal
    // This is a simplified example - in a real app, you'd want to verify the subscription details
    const paypalResponse = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    })

    if (!paypalResponse.ok) {
      return NextResponse.json(
        { error: "Failed to verify subscription with PayPal" },
        { status: paypalResponse.status },
      )
    }

    const paypalData = await paypalResponse.json()

    // Check if the subscription is active
    if (paypalData.status !== "ACTIVE" && paypalData.status !== "APPROVED") {
      return NextResponse.json({ error: `Subscription is not active. Status: ${paypalData.status}` }, { status: 400 })
    }

    // Get the current user from the request
    const supabase = createServiceClient()

    // Get the user from the auth token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication failed: " + (authError?.message || "User not found") },
        { status: 401 },
      )
    }

    // Save the phone number to the database
    const { data: phoneData, error: phoneError } = await supabase
      .from("phone_numbers")
      .insert({
        user_id: user.id,
        number: phoneNumber,
        friendly_name: `${country} Number`,
        location: country === "US" ? "United States" : country,
        type: "voice",
        status: "active",
        monthly_fee: Number.parseFloat(paypalData.billing_info?.outstanding_balance?.value || "0"),
        purchased_at: new Date().toISOString(),
      })
      .select()

    if (phoneError) {
      console.error("Error saving phone number to database:", phoneError)
      return NextResponse.json(
        { error: "Failed to save phone number to database: " + phoneError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Phone number purchased successfully",
      phoneNumber,
      subscriptionId,
      phoneData,
    })
  } catch (error) {
    console.error("Error confirming purchase:", error)
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
