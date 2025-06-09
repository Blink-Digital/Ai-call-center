import { type NextRequest, NextResponse } from "next/server"

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
  console.log("\n=== 🔍 BLAND.AI CALL HISTORY API DEBUG ===")

  try {
    // Get the phone number and pagination params from query parameters
    const { searchParams } = new URL(request.url)
    const phoneNumber = searchParams.get("phone")
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "100", 10) // Default to 100 instead of 3

    if (!phoneNumber) {
      console.log("❌ [PARAMS] No phone number provided")
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    console.log("📞 [INPUT] Raw phone number:", phoneNumber)
    console.log("📄 [PAGINATION] Page:", page, "Page Size:", pageSize)

    // 1️⃣ Format phone number for Bland.ai API
    let formattedNumber = phoneNumber.trim()

    // Remove all non-digit characters except +
    const digitsOnly = formattedNumber.replace(/[^\d]/g, "")
    console.log("🔧 [CLEAN] Digits only:", digitsOnly)

    // Format as E.164
    if (digitsOnly.length === 10) {
      formattedNumber = `+1${digitsOnly}`
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
      formattedNumber = `+${digitsOnly}`
    } else if (digitsOnly.length === 11) {
      formattedNumber = `+1${digitsOnly}`
    } else {
      formattedNumber = `+${digitsOnly}`
    }

    console.log("✅ [FORMATTED] Final number:", formattedNumber)

    // 2️⃣ Check API key
    const blandApiKey = process.env.BLAND_AI_API_KEY
    if (!blandApiKey) {
      console.log("❌ [API KEY] Not configured")
      return NextResponse.json({ error: "Bland.ai API key not configured" }, { status: 500 })
    }

    console.log("✅ [API KEY] Configured")

    // 3️⃣ Try multiple API endpoints to find calls
    const endpoints = [
      // Try with to_number (calls TO this number)
      `https://api.bland.ai/v1/calls?to_number=${encodeURIComponent(formattedNumber)}&limit=${pageSize}`,
      // Try with from_number (calls FROM this number)
      `https://api.bland.ai/v1/calls?from_number=${encodeURIComponent(formattedNumber)}&limit=${pageSize}`,
      // Try without specific number filter (get all calls)
      `https://api.bland.ai/v1/calls?limit=${pageSize}`,
    ]

    let allCalls: BlandCall[] = []
    let totalCount = 0

    for (let i = 0; i < endpoints.length; i++) {
      const apiUrl = endpoints[i]
      console.log(`\n--- ATTEMPT ${i + 1}: ${i === 0 ? "TO_NUMBER" : i === 1 ? "FROM_NUMBER" : "ALL_CALLS"} ---`)
      console.log("🌐 [API URL]", apiUrl)

      try {
        const blandResponse = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${blandApiKey}`,
            "Content-Type": "application/json",
          },
        })

        console.log("📡 [RESPONSE] Status:", blandResponse.status)

        if (!blandResponse.ok) {
          const errorText = await blandResponse.text()
          console.log("❌ [API ERROR]", errorText)
          continue
        }

        const rawResponseText = await blandResponse.text()
        console.log("📄 [RAW RESPONSE] Length:", rawResponseText.length)

        let blandData: BlandApiResponse
        try {
          blandData = JSON.parse(rawResponseText)
        } catch (jsonError) {
          console.log("❌ [JSON PARSE] Failed:", jsonError)
          continue
        }

        console.log("✅ [PARSED] Found", blandData.calls?.length || 0, "calls")

        if (blandData.calls && blandData.calls.length > 0) {
          // Filter calls that match our phone number (either to or from)
          const matchingCalls = blandData.calls.filter((call) => {
            const callTo = call.to?.replace(/[^\d]/g, "")
            const callFrom = call.from?.replace(/[^\d]/g, "")
            const targetDigits = digitsOnly

            const toMatches = callTo === targetDigits || callTo === targetDigits.substring(1)
            const fromMatches = callFrom === targetDigits || callFrom === targetDigits.substring(1)

            if (toMatches || fromMatches) {
              console.log("🎯 [MATCH] Call:", call.call_id, "TO:", call.to, "FROM:", call.from)
            }

            return toMatches || fromMatches
          })

          allCalls = [...allCalls, ...matchingCalls]
          totalCount += matchingCalls.length

          console.log("📊 [FILTERED] Matching calls:", matchingCalls.length)
        }

        // If we found calls in the first attempt, we can stop
        if (i === 0 && allCalls.length > 0) {
          break
        }
      } catch (fetchError) {
        console.log("💥 [FETCH ERROR]", fetchError)
        continue
      }
    }

    // 4️⃣ Remove duplicates based on call_id
    const uniqueCalls = allCalls.filter(
      (call, index, self) => index === self.findIndex((c) => c.call_id === call.call_id),
    )

    console.log("\n=== 📊 FINAL RESULTS ===")
    console.log("🎯 [TOTAL UNIQUE CALLS]", uniqueCalls.length)
    console.log("📞 [PHONE NUMBER]", formattedNumber)

    if (uniqueCalls.length > 0) {
      console.log("✅ [SUCCESS] Call history found!")
      uniqueCalls.forEach((call, i) => {
        console.log(
          `📞 [CALL ${i + 1}] ID: ${call.call_id}, TO: ${call.to}, FROM: ${call.from}, DATE: ${call.created_at}`,
        )
      })
    } else {
      console.log("❌ [NO CALLS] No matching calls found")
    }

    console.log("=== END DEBUG ===\n")

    return NextResponse.json({
      count: uniqueCalls.length,
      calls: uniqueCalls,
      phone_number: phoneNumber,
      formatted_number: formattedNumber,
      page,
      pageSize,
      totalPages: Math.ceil(uniqueCalls.length / pageSize),
      debug_info: {
        endpoints_tried: endpoints.length,
        total_calls_found: allCalls.length,
        unique_calls: uniqueCalls.length,
        search_digits: digitsOnly,
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
