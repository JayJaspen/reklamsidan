import { SkeletonBox } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="max-w-2xl space-y-3">
      <SkeletonBox className="mb-6 h-8 w-48" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-8 w-8 rounded-lg" />
            <SkeletonBox className="h-4 w-32" />
          </div>
          <SkeletonBox className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </div>
  )
}
