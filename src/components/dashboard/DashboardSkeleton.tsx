export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Skeleton cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-6 w-16 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton table */}
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-4 h-5 w-56 rounded bg-gray-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 flex-1 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
