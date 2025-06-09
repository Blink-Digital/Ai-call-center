export default function TeamsLoading() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Teams</h1>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200"></div>
          <div className="h-24 animate-pulse rounded bg-gray-200"></div>
          <div className="h-12 w-1/4 animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  )
}
