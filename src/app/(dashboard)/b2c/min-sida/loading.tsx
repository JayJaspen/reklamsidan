import { FormSkeleton, SkeletonBox } from '@/components/Skeleton'
export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6">
      <SkeletonBox className="h-8 w-48" />
      <FormSkeleton fields={5} />
    </div>
  )
}
