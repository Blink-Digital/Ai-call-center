import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface BlandCall {
  call_id: string
  created_at: string
  call_length: number
  to: string
  from: string
  completed: boolean
  queue_status: string
  answered_by: string
  batch_id?: string
}

interface BlandApiResponse {
  count: number
  calls: BlandCall[]
}

export async function GET(request: NextRequest) {
  console.log("\n=== 🔍 BLAND.AI CALL HISTORY DEBUG TRACE ===")

  try {
    // Create Supabase client with cookies for authentication
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("❌ [AUTH] No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [AUTH] User authenticated:", session.user.id)

    // Get the phone number from query parameters
    const { searchParams } = new URL(request.url)
    const phoneNumber = searchParams.get("to_number")

    if (!phoneNumber) {
      console.log("❌ [PARAMS] No phone number provided in query")
      return NextResponse.json({ error: "Phone number (to_number) is required" }, { status: 400 })
    }

    console.log("📞 [RAW INPUT] Phone number from frontend:", phoneNumber)

    // 1️⃣ STEP 1: Get user's phone numbers and find a match
    console.log("\n--- STEP 1: DATABASE LOOKUP ---")

    // Get all phone numbers for this user
    const { data: userPhoneNumbers, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", session.user.id)

    console.log("🔍 [DB QUERY] Table: phone_numbers")
    console.log("🔍 [DB QUERY] Filter user_id:", session.user.id)

    if (phoneError) {
      console.log("❌ [DB ERROR]", phoneError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!userPhoneNumbers || userPhoneNumbers.length === 0) {
      console.log("❌ [DB RESULT] No phone numbers found for user")
      return NextResponse.json({ error: "No phone numbers found for user" }, { status: 403 })
    }

    console.log("✅ [DB RESULT] Found", userPhoneNumbers.length, "phone numbers for user")
    console.log(
      "📞 [DB NUMBERS]",
      userPhoneNumbers.map((p) => p.number),
    )

    // Find matching phone number by comparing cleaned versions
    const cleanInput = phoneNumber.replace(/\D/g, "")
    console.log("🧹 [SEARCH] Cleaned input:", cleanInput)

    const matchingNumber = userPhoneNumbers.find((phone) => {
      const cleanDb = phone.number.replace(/\D/g, "")
      console.log("🔍 [COMPARE] DB:", phone.number, "→", cleanDb, "vs Input:", cleanInput)
      return cleanDb === cleanInput
    })

    if (!matchingNumber) {
      console.log("❌ [MATCH] No matching phone number found")
      console.log(
        "📞 [AVAILABLE]",
        userPhoneNumbers.map((p) => `${p.number} (${p.number.replace(/\D/g, "")})`),
      )
      return NextResponse.json({ error: "Phone number not found or not authorized" }, { status: 403 })
    }

    console.log("✅ [MATCH] Found matching number:", matchingNumber.number)

    // 2️⃣ STEP 2: Format the Phone Number for Bland.ai
    console.log("\n--- STEP 2: PHONE NUMBER FORMATTING ---")

    const rawNumber = matchingNumber.number
    console.log("🔧 [FORMAT] Starting with:", rawNumber)

    // Remove all non-digit characters
    const digitsOnly = rawNumber.replace(/\D/g, "")
    console.log("🔧 [FORMAT] After removing non-digits:", digitsOnly)

    // Format as E.164
    let formattedNumber: string
    if (digitsOnly.length === 10) {
      formattedNumber = `+1${digitsOnly}`
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
      formattedNumber = `+${digitsOnly}`
    } else {
      formattedNumber = `+${digitsOnly}`
    }

    console.log("✅ [FORMATTED NUMBER]", formattedNumber)

    // 3️⃣ STEP 3: URL Encoding
    console.log("\n--- STEP 3: URL ENCODING ---")

    const encodedNumber = encodeURIComponent(formattedNumber)
    console.log("✅ [ENCODED FOR API]", encodedNumber)

    // 4️⃣ STEP 4: Build API URL
    console.log("\n--- STEP 4: API URL CONSTRUCTION ---")

    const apiUrl = `https://api.bland.ai/v1/calls?to_number=${encodedNumber}`
    console.log("✅ [FINAL API URL]", apiUrl)

    // 5️⃣ STEP 5: API Key Check
    const blandApiKey = process.env.BLAND_AI_API_KEY
    if (!blandApiKey) {
      console.log("❌ [API KEY] Not configured")
      return NextResponse.json({ error: "Bland.ai API key not configured" }, { status: 500 })
    }

    console.log("✅ [API KEY] Configured")

    // 6️⃣ STEP 6: Make API Request
    console.log("\n--- STEP 6: BLAND.AI API REQUEST ---")

    const blandResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${blandApiKey}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 [RESPONSE] Status:", blandResponse.status)

    const rawResponseText = await blandResponse.text()
    console.log("📄 [RAW RESPONSE] First 200 chars:", rawResponseText.substring(0, 200))

    // Handle non-OK responses
    if (!blandResponse.ok) {
      console.log("❌ [API ERROR] Non-OK response")
      return NextResponse.json(
        {
          count: 0,
          calls: [],
          error: `Bland.ai API error: ${blandResponse.status} ${blandResponse.statusText}`,
          details: rawResponseText,
          debug_trace: {
            step: "API_REQUEST_FAILED",
            raw_input: phoneNumber,
            db_number: rawNumber,
            formatted_number: formattedNumber,
            encoded_number: encodedNumber,
            api_url: apiUrl,
            response_status: blandResponse.status,
            response_text: rawResponseText,
          },
          phone_number: phoneNumber,
        },
        { status: blandResponse.status },
      )
    }

    // Parse JSON response
    let blandData: BlandApiResponse
    try {
      blandData = JSON.parse(rawResponseText)
      console.log("✅ [JSON PARSE] Success - Found", blandData.count, "calls")
    } catch (jsonError) {
      console.log("❌ [JSON PARSE] Failed:", jsonError)
      return NextResponse.json(
        {
          count: 0,
          calls: [],
          error: "Invalid JSON response from Bland.ai",
          details: rawResponseText,
          debug_trace: {
            step: "JSON_PARSE_FAILED",
            raw_input: phoneNumber,
            db_number: rawNumber,
            formatted_number: formattedNumber,
            encoded_number: encodedNumber,
            api_url: apiUrl,
            response_status: blandResponse.status,
            response_text: rawResponseText,
          },
          phone_number: phoneNumber,
        },
        { status: 500 },
      )
    }

    console.log("🎉 [SUCCESS] Call history retrieved successfully")
    console.log("=== END DEBUG TRACE ===\n")

    return NextResponse.json({
      count: blandData.count || 0,
      calls: blandData.calls || [],
      phone_number: phoneNumber,
      formatted_number: formattedNumber,
      debug_trace: {
        step: "SUCCESS",
        raw_input: phoneNumber,
        db_number: rawNumber,
        formatted_number: formattedNumber,
        encoded_number: encodedNumber,
        api_url: apiUrl,
        response_status: blandResponse.status,
        calls_found: blandData.count || 0,
      },
    })
  } catch (error) {
    console.log("💥 [UNEXPECTED ERROR]", error)
    return NextResponse.json(
      {
        count: 0,
        calls: [],
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
