// Reusable skeleton primitives
export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

// Ad card skeleton – matches AdCard layout
export function AdCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <SkeletonBox className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-4 w-1/3" />
          <SkeletonBox className="h-3 w-1/5" />
        </div>
        <SkeletonBox className="h-8 w-20 rounded-full" />
      </div>
      <SkeletonBox className="h-40 w-full rounded-xl" />
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-4/5" />
    </div>
  )
}

// Row skeleton – for lists (sparad, favoriter, jobs, etc.)
export function RowSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <SkeletonBox className="h-12 w-12 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-1/2" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <SkeletonBox key={i} className="h-3 w-3/4" />
        ))}
      </div>
      <SkeletonBox className="h-8 w-24 rounded-lg" />
    </div>
  )
}

// Stat card skeleton – for statistik
export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-4 w-1/3" />
        <SkeletonBox className="h-8 w-8 rounded-lg" />
      </div>
      <SkeletonBox className="h-8 w-1/2" />
      <SkeletonBox className="h-3 w-2/3" />
    </div>
  )
}

// Form skeleton – for min-sida
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="card p-6 space-y-5">
      <SkeletonBox className="h-5 w-1/4" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <SkeletonBox className="h-3 w-1/5" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <SkeletonBox className="h-10 w-32 rounded-xl" />
    </div>
  )
}

// Table skeleton – for fakturor, admin
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-gray-100 p-4">
        <SkeletonBox className="h-4 w-1/4" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((__, c) => (
              <SkeletonBox key={c} className={`h-4 ${c === 0 ? 'w-1/4' : c === cols - 1 ? 'w-16' : 'w-1/6'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
