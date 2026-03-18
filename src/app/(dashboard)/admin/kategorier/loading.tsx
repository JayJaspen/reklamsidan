import { SkeletonBox } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-6">
        <SkeletonBox className="h-8 w-40" />
        <SkeletonBox className="h-9 w-36 rounded-xl" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-8 w-8 rounded-lg" />
            <SkeletonBox className="h-4 w-36" />
          </div>
          <div className="flex gap-2">
            <SkeletonBox className="h-8 w-8 rounded-lg" />
            <SkeletonBox className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
