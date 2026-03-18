import { StatCardSkeleton, SkeletonBox, TableSkeleton } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonBox className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <TableSkeleton rows={4} cols={4} />
    </div>
  )
}
