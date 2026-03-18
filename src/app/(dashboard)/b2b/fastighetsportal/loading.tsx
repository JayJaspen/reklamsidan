import { RowSkeleton } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="space-y-3">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-9 w-28 animate-pulse rounded-xl bg-gray-100" />
      </div>
      <RowSkeleton lines={2} />
      <RowSkeleton lines={2} />
      <RowSkeleton lines={2} />
      <RowSkeleton lines={2} />
    </div>
  )
}
