import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Create a Supabase client with the user's session
    const supabase = createServerClient(cookies())

    // Get the current user to verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the Bland.ai API key
    const blandApiKey = process.env.BLAND_AI_API_KEY
    if (!blandApiKey) {
      return NextResponse.json({ error: "Bland.ai API key not configured" }, { status: 500 })
    }

    console.log("[DEBUG] Checking Bland.ai account information...")

    // First, let's check the account info
    const accountResponse = await fetch("https://api.bland.ai/v1/me", {
      headers: {
        Authorization: `Bearer ${blandApiKey}`,
        "Content-Type": "application/json",
      },
    })

    const accountText = await accountResponse.text()
    console.log(`[DEBUG] Account response: ${accountResponse.status} - ${accountText}`)

    let accountData = null
    if (accountResponse.ok) {
      try {
        accountData = JSON.parse(accountText)
      } catch (e) {
        console.error("[ERROR] Failed to parse account response:", accountText)
      }
    }

    // Now let's try to get the phone numbers from Bland.ai
    const numbersResponse = await fetch("https://api.bland.ai/v1/inbound", {
      headers: {
        Authorization: `Bearer ${blandApiKey}`,
        "Content-Type": "application/json",
      },
    })

    const numbersText = await numbersResponse.text()
    console.log(`[DEBUG] Numbers response: ${numbersResponse.status} - ${numbersText}`)

    let blandNumbers = []
    if (numbersResponse.ok) {
      try {
        const numbersData = JSON.parse(numbersText)
        blandNumbers = numbersData.inbound_numbers || numbersData.numbers || numbersData || []
      } catch (e) {
        console.error("[ERROR] Failed to parse numbers response:", numbersText)
      }
    }

    // Get numbers from our Supabase database
    const { data: supabaseNumbers, error: supabaseError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", session.user.id)

    console.log("[DEBUG] Supabase numbers:", supabaseNumbers)

    // Test different formatting approaches for the user's number
    const testFormats = []
    if (supabaseNumbers && supabaseNumbers.length > 0) {
      const userNumber = supabaseNumbers[0].number
      const digitsOnly = userNumber.replace(/\D/g, "")

      testFormats.push({
        description: "Original from database",
        value: userNumber,
      })
      testFormats.push({
        description: "Digits only",
        value: digitsOnly,
      })
      testFormats.push({
        description: "With +1 prefix",
        value: `+1${digitsOnly.length === 10 ? digitsOnly : digitsOnly.substring(1)}`,
      })
      testFormats.push({
        description: "With + prefix",
        value: `+${digitsOnly}`,
      })
      testFormats.push({
        description: "URL encoded +1",
        value: encodeURIComponent(`+1${digitsOnly.length === 10 ? digitsOnly : digitsOnly.substring(1)}`),
      })
    }

    return NextResponse.json({
      debug_info: {
        api_key_configured: !!blandApiKey,
        api_key_prefix: blandApiKey ? `${blandApiKey.substring(0, 10)}...` : null,
        account_response: {
          status: accountResponse.status,
          ok: accountResponse.ok,
          data: accountData,
          raw_text: accountText.substring(0, 500),
        },
        numbers_response: {
          status: numbersResponse.status,
          ok: numbersResponse.ok,
          raw_text: numbersText.substring(0, 500),
        },
        bland_numbers: blandNumbers,
        supabase_numbers: supabaseNumbers,
        supabase_error: supabaseError,
        test_formats: testFormats,
        user_id: session.user.id,
      },
    })
  } catch (error) {
    console.error("[ERROR] Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
