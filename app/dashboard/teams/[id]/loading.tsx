export default function TeamDetailLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200 mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
            <div className="h-6 w-1/4 animate-pulse rounded bg-gray-200 mb-4"></div>
            <div className="h-24 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="h-6 w-1/4 animate-pulse rounded bg-gray-200 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
