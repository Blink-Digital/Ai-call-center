import { type NextRequest, NextResponse } from "next/server"

// Function to get PayPal access token
async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured")
  }

  console.log("Getting PayPal access token...")

  // Determine if we're using sandbox or production
  const baseUrl = "https://api-m.sandbox.paypal.com"

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayPal token error:", response.status, errorText)
      throw new Error(`Failed to get PayPal access token: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Got PayPal access token")
    return data.access_token
  } catch (error) {
    console.error("Error getting PayPal token:", error)
    throw error
  }
}

// Function to create a product in PayPal
async function createProduct(accessToken: string, name: string, description: string) {
  console.log("Creating PayPal product:", name)

  // Determine if we're using sandbox or production
  const baseUrl = "https://api-m.sandbox.paypal.com"

  try {
    const response = await fetch(`${baseUrl}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name,
        description,
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayPal product creation error:", response.status, errorText)
      throw new Error(`Failed to create PayPal product: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Created PayPal product:", data.id)
    return data
  } catch (error) {
    console.error("Error creating PayPal product:", error)
    throw error
  }
}

// Function to create a billing plan in PayPal
async function createBillingPlan(
  accessToken: string,
  productId: string,
  name: string,
  description: string,
  price: string,
) {
  console.log("Creating PayPal billing plan:", name, "with price:", price)

  // Determine if we're using sandbox or production
  const baseUrl = "https://api-m.sandbox.paypal.com"

  try {
    const response = await fetch(`${baseUrl}/v1/billing/plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        product_id: productId,
        name,
        description,
        billing_cycles: [
          {
            frequency: {
              interval_unit: "MONTH",
              interval_count: 1,
            },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: price,
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: "0",
            currency_code: "USD",
          },
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayPal plan creation error:", response.status, errorText)
      throw new Error(`Failed to create PayPal billing plan: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Created PayPal billing plan:", data.id)
    return data
  } catch (error) {
    console.error("Error creating PayPal billing plan:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  console.log("Received request to create PayPal plan")

  try {
    const { phoneNumber, price, displayNumber } = await request.json()

    if (!phoneNumber || !price) {
      console.error("Missing required fields:", { phoneNumber, price })
      return NextResponse.json({ error: "Phone number and price are required" }, { status: 400 })
    }

    console.log("Creating plan for:", displayNumber || phoneNumber, "with price:", price)

    // Format price to 2 decimal places
    const formattedPrice = Number.parseFloat(price).toFixed(2)

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()

    // Create a product for this phone number
    const product = await createProduct(
      accessToken,
      `Phone Number Subscription - ${displayNumber || phoneNumber}`,
      `Monthly subscription for phone number ${displayNumber || phoneNumber}`,
    )

    // Create a billing plan for this product
    const plan = await createBillingPlan(
      accessToken,
      product.id,
      `Monthly Subscription - ${displayNumber || phoneNumber}`,
      `Monthly billing for phone number ${displayNumber || phoneNumber}`,
      formattedPrice,
    )

    console.log("Successfully created plan:", plan.id)

    return NextResponse.json({
      success: true,
      planId: plan.id,
      productId: product.id,
    })
  } catch (error) {
    console.error("Error creating PayPal plan:", error)
    return NextResponse.json(
      { error: `Failed to create PayPal plan: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
