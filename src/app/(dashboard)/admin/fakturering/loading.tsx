import { TableSkeleton, SkeletonBox } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-8 w-40" />
        <SkeletonBox className="h-9 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  )
}
