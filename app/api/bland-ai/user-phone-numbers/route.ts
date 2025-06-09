import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, you would fetch this from Bland.ai API
    // using the user's API key or session token

    // For now, we'll return the purchased phone number from the Phone Numbers page
    const purchasedNumbers = [
      {
        id: "1",
        number: "+19787836427",
        location: "Massachusetts",
        type: "Voice",
        status: "Active",
        purchaseDate: "2025-04-10",
        monthlyFee: "$1.00",
        assignedTo: "My Pathway",
      },
      // You can add more purchased numbers here if needed
    ]

    return NextResponse.json(purchasedNumbers)
  } catch (error) {
    console.error("Error fetching user phone numbers:", error)
    return NextResponse.json({ error: "Failed to fetch phone numbers" }, { status: 500 })
  }
}
