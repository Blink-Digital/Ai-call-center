export default function Loading() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
      </div>
      <div className="flex-1 p-6">
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      </div>
    </div>
  )
}
