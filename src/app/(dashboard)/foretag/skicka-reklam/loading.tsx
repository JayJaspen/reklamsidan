import { RowSkeleton, SkeletonBox } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="max-w-3xl space-y-4">
      <SkeletonBox className="h-8 w-48" />
      <SkeletonBox className="h-12 w-full rounded-xl" />
      <RowSkeleton lines={2} />
      <RowSkeleton lines={2} />
      <RowSkeleton lines={2} />
    </div>
  )
}
