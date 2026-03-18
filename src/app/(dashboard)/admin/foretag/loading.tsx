import { TableSkeleton, SkeletonBox } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-8 w-40" />
        <SkeletonBox className="h-9 w-48 rounded-xl" />
      </div>
      <TableSkeleton rows={7} cols={5} />
    </div>
  )
}
