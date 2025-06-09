import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { getInvitationByToken, acceptInvitation } from "@/lib/db-utils"

// Get invitation details
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token

    const invitation = await getInvitationByToken(token)
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Check if invitation has already been accepted
    if (invitation.accepted) {
      return NextResponse.json({ error: "Invitation has already been accepted" }, { status: 400 })
    }

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error("Error fetching invitation:", error)
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 })
  }
}

// Accept invitation
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = params.token

    await acceptInvitation(token, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}
