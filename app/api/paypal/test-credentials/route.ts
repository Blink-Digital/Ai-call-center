import { NextResponse } from "next/server"

export async function GET() {
  try {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET

    if (!clientId) {
      return NextResponse.json({ error: "NEXT_PUBLIC_PAYPAL_CLIENT_ID is not configured" }, { status: 500 })
    }

    if (!clientSecret) {
      return NextResponse.json({ error: "PAYPAL_CLIENT_SECRET is not configured" }, { status: 500 })
    }

    // Try to get an access token to verify credentials
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          error: `PayPal authentication failed: ${response.status}`,
          details: errorText,
        },
        { status: 500 },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "PayPal credentials are valid",
      tokenExpires: data.expires_in,
      // Only return a masked version of the credentials for security
      clientId: clientId.substring(0, 5) + "..." + clientId.substring(clientId.length - 5),
      clientSecret: "***" + clientSecret.substring(clientSecret.length - 4),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: `Error testing PayPal credentials: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
