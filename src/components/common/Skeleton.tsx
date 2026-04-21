export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />
  );
}

// ─── Versements ───────────────────────────────────────────────────────────────

export function SkeletonVersementsHeader() {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-7 w-24 rounded-xl" />
    </div>
  );
}

export function SkeletonTrancheRow() {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-[72px] rounded-xl" />
    </div>
  );
}

export function SkeletonEventPayoutCard() {
  return (
    <div className="glass-card overflow-hidden border border-white/[0.06]">
      <div className="px-4 py-4 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="flex-1 h-1 rounded-full" />
          <Skeleton className="h-3 w-32 rounded-lg" />
        </div>
      </div>
      <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonTrancheRow key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPayoutHistoryRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-3 w-16 flex-shrink-0" />
    </div>
  );
}

export function SkeletonBalanceCard() {
  return (
    <div className="glass-card overflow-hidden border border-white/[0.06]">
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="w-[76px] h-[68px] rounded-xl flex-shrink-0" />
      </div>
      <div className="px-5 py-2.5 border-t border-white/5">
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
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
