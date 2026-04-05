interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 ${className}`}
    />
  )
}

export function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="h-10 w-10 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export function CardSkeleton() {
  return <Skeleton className="h-28 w-full rounded-3xl" />
}
