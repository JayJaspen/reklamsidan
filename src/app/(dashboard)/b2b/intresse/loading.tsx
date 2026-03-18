import { AdCardSkeleton } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
      <AdCardSkeleton />
      <AdCardSkeleton />
      <AdCardSkeleton />
    </div>
  )
}
