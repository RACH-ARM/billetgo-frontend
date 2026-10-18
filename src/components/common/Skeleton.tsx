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

// ─── Mes Événements — carte événement (grille "à venir / en cours") ───────────

export function SkeletonEventCard() {
  return (
    <div className="glass-card flex flex-col border border-white/5 overflow-hidden">
      <div className="h-36 sm:h-40 flex-shrink-0 bg-white/[0.06] animate-pulse" />
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
        <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-auto">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonEventCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonEventCard key={i} />
      ))}
    </div>
  );
}

// ─── Mes Événements — ligne compacte historique ──────────────────────────────

export function SkeletonEventHistoryRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-3 w-20 hidden sm:block flex-shrink-0" />
      <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
    </div>
  );
}

// ─── Tableau acheteurs ────────────────────────────────────────────────────────

export function SkeletonBuyersTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                <td className="px-5 py-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-32 hidden sm:block" />
                  </div>
                </td>
                <td className="px-5 py-4"><Skeleton className="h-3 w-20" /></td>
                <td className="px-5 py-4 flex justify-end"><Skeleton className="h-4 w-16" /></td>
                <td className="px-5 py-4 hidden sm:table-cell"><Skeleton className="h-3 w-14" /></td>
                <td className="px-5 py-4 hidden sm:table-cell"><Skeleton className="h-3 w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Codes promo / scanners / agents — lignes "poste" ────────────────────────

export function SkeletonAccessRow() {
  return (
    <div className="glass-card p-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Skeleton className="h-7 w-[72px] rounded-lg" />
        <Skeleton className="h-7 w-9 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonAccessList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAccessRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonPromoCodeRow() {
  return (
    <div className="glass-card p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="space-y-1.5 text-right hidden sm:block">
          <Skeleton className="h-2.5 w-10 ml-auto" />
          <Skeleton className="h-4 w-8 ml-auto" />
        </div>
        <div className="space-y-1.5 text-right">
          <Skeleton className="h-2.5 w-16 ml-auto" />
          <Skeleton className="h-4 w-14 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPromoCodeList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPromoCodeRow key={i} />
      ))}
    </div>
  );
}

// ─── Formulaire événement (édition) ───────────────────────────────────────────

export function SkeletonForm() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
