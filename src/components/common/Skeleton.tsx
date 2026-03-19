export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />
  );
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5 border border-white/5 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-2 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-5 border border-white/5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-24 flex-shrink-0" />
      </div>
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden border border-white/5">
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 hidden md:block" />
            <Skeleton className="h-6 w-20 hidden sm:block" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
