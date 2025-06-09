import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { getActivitiesByPathwayId, canViewPathway } from "@/lib/db-utils"

// Get activities for a specific pathway
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pathwayId = params.id

    // Check if user has access to this pathway
    const hasAccess = await canViewPathway(pathwayId, user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have access to this pathway" }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")

    const activities = await getActivitiesByPathwayId(pathwayId, limit, offset)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}
