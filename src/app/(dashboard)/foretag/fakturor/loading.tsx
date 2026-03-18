import { TableSkeleton, SkeletonBox } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonBox className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        <SkeletonBox className="h-24 rounded-xl" />
        <SkeletonBox className="h-24 rounded-xl" />
        <SkeletonBox className="h-24 rounded-xl" />
      </div>
      <TableSkeleton rows={5} cols={5} />
    </div>
  )
}
