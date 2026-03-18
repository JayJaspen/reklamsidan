import { RowSkeleton, SkeletonBox } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="max-w-3xl space-y-3">
      <div className="mb-4 flex items-center justify-between">
        <SkeletonBox className="h-8 w-40" />
        <SkeletonBox className="h-9 w-28 rounded-xl" />
      </div>
      <SkeletonBox className="h-12 w-full rounded-xl" />
      <RowSkeleton lines={3} />
      <RowSkeleton lines={3} />
      <RowSkeleton lines={3} />
    </div>
  )
}
