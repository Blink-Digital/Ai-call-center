import { Suspense } from "react"
import { TeamDetailClient } from "@/components/teams/team-detail-client"
import Loading from "./loading"

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<Loading />}>
        <TeamDetailClient teamId={params.id} />
      </Suspense>
    </div>
  )
}
