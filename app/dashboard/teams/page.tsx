import type { Metadata } from "next"
import { TeamsClient } from "@/components/teams/teams-client"

export const metadata: Metadata = {
  title: "Teams | Bland.ai Flowchart Builder",
  description: "Manage your teams and collaborators",
}

export default function TeamsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Teams</h1>
      <TeamsClient />
    </div>
  )
}
