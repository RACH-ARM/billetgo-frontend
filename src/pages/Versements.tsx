import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote, Check, Mail,
  TrendingUp, TrendingDown, CheckCheck, Award, Shield, Zap, Star,
  ArrowDownToLine, Loader2, Clock, ChevronDown, ChevronUp, History, X,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import {
  useOrganizerPayouts,
  useOrganizerProfile,
  useOrganizerPayoutSchedules,
  useOrganizerStats,
  usePlatformRates,
  useOrganizerDebts,
  useRetryDebtCollect,
} from '../hooks/useOrganizer';
import { useQueryClient } from 'react-query';
import { type OrganizerPayout, type PayoutScheduleEntry, type OrganizerDebt } from '../services/organizerService';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/formatPrice';
import {
  SkeletonKpiGrid,
  SkeletonVersementsHeader,
  SkeletonEventPayoutCard,
  SkeletonPayoutHistoryRow,
  SkeletonBalanceCard,
} from '../components/common/Skeleton';
import WithdrawModal, { type WithdrawContext } from '../components/common/WithdrawModal';

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_META: Record<string, {
  label: string; color: string; bg: string; border: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  NEW:       { label: 'Nouveau',  color: 'text-white/50',    bg: 'bg-white/5',        border: 'border-white/10',       Icon: Star   },
  APPROVED:  { label: 'Approuvé', color: 'text-cyan-neon',   bg: 'bg-cyan-neon/10',   border: 'border-cyan-neon/20',   Icon: Shield },
  CERTIFIED: { label: 'Certifié', color: 'text-violet-neon', bg: 'bg-violet-neon/10', border: 'border-violet-neon/20', Icon: Award  },
  PREMIUM:   { label: 'Premium',  color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/20',  Icon: Zap    },
};

const TIER_PERKS: Record<string, { label: string; day: string }[]> = {
  NEW:       [{ label: '70%', day: 'J−3' }, { label: '100%', day: 'J+7' }],
  APPROVED:  [{ label: '40%', day: 'J−14' }, { label: '80%', day: 'J−3' }, { label: '100%', day: 'J+7' }],
  CERTIFIED: [{ label: '60%', day: 'J−14' }, { label: '90%', day: 'J−3' }, { label: '100%', day: 'J+7' }],
  PREMIUM:   [{ label: '80%', day: 'J−14' }, { label: '95%', day: 'J−3' }, { label: '100%', day: 'J+7' }],
};

// ─── Status chip ──────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  if (status === 'RELEASED')   return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-400"><Check className="w-3 h-3" /> Versé</span>;
  if (status === 'PROCESSING') return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-neon/70"><Clock className="w-3 h-3" /> Première tranche déjà retirée</span>;
  if (status === 'CANCELLED')  return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/30"><X className="w-3 h-3" /> Annulé</span>;
  return null;
}

// ─── Tranche row ──────────────────────────────────────────────────────────────
function TrancheRow({ s, onWithdraw, isLoading }: {
  s: PayoutScheduleEntry;
  onWithdraw: (s: PayoutScheduleEntry) => void;
  isLoading: boolean;
}) {
  const label      = s.tranche === 1 ? 'J−14' : s.tranche === 2 ? 'J−3' : 'J+7';
  const pct        = `${Math.round(s.percentage * 100)}%`;
  const date       = new Date(s.scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const isEligible = s.isEligible && ['PENDING', 'PROCESSING'].includes(s.status) && s.trancheAmount > 0;
  const isPast     = !s.isEligible && s.status === 'PENDING';

  return (
    <div className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 ${
      isEligible ? 'bg-violet-neon/[0.04]' : s.status === 'RELEASED' ? 'bg-green-500/[0.03]' : ''
    }`}>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] text-white/30">T{s.tranche}</span>
          <span className={`text-sm font-bold ${isEligible ? 'text-violet-neon' : 'text-white/60'}`}>{label}</span>
          <span className="text-[11px] text-white/25">jusqu'à {pct}</span>
        </div>
        <p className="font-mono text-[11px] text-white/20 mt-0.5">{date}</p>
      </div>

      <div>
        {s.status === 'RELEASED' ? (
          <p className="font-mono font-bold text-green-400">{formatPrice(s.amountReleased ?? 0, 'FCFA', '0 FCFA')}</p>
        ) : s.status === 'PROCESSING' ? (
          <p className="font-mono font-bold text-cyan-neon/60">{formatPrice(s.amountReleased ?? s.trancheAmount, 'FCFA', '0 FCFA')}</p>
        ) : s.trancheAmount > 0 ? (
          <p className={`font-mono font-bold ${isEligible ? 'text-white' : 'text-white/30'}`}>
            {formatPrice(s.trancheAmount, 'FCFA')}
          </p>
        ) : (
          <span className="text-[11px] text-white/20">—</span>
        )}
        {(s.status === 'RELEASED' || s.status === 'PROCESSING' || s.status === 'CANCELLED') && (
          <div className="mt-0.5"><StatusChip status={s.status} /></div>
        )}
        {isPast && (
          <span className="inline-flex items-center gap-1 text-[11px] text-white/25 mt-0.5">
            <Clock className="w-3 h-3" /> Pas encore disponible
          </span>
        )}
      </div>

      <div className="flex-shrink-0">
        {isEligible ? (
          <button
            onClick={() => onWithdraw(s)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-neon text-white text-xs font-bold hover:bg-violet-neon/80 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
            Retirer
          </button>
        ) : (
          <div className="w-[72px]" />
        )}
      </div>
    </div>
  );
}

// ─── Event payout card ────────────────────────────────────────────────────────
function EventPayoutCard({ eventTitle, eventDate, schedules, onWithdraw, isWithdrawing }: {
  eventTitle: string;
  eventDate: string;
  schedules: PayoutScheduleEntry[];
  onWithdraw: (s: PayoutScheduleEntry) => void;
  isWithdrawing: boolean;
}) {
  const [open, setOpen]   = useState(true);
  const totalOrg          = schedules[0]?.totalOrganizerAmount ?? 0;
  const totalReleased     = schedules.reduce((s, t) => s + (['RELEASED', 'PROCESSING'].includes(t.status) ? (t.amountReleased ?? 0) : 0), 0);
  const hasEligible       = schedules.some((s) => s.isEligible && s.status === 'PENDING' && s.trancheAmount > 0);
  const progress          = totalOrg > 0 ? Math.min(100, Math.round((totalReleased / totalOrg) * 100)) : 0;

  return (
    <div className={`glass-card overflow-hidden border ${hasEligible ? 'border-violet-neon/30' : 'border-white/[0.06]'}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white truncate">{eventTitle}</p>
            {hasEligible && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-neon/15 border border-violet-neon/30 text-violet-neon text-[11px] font-bold">
                <ArrowDownToLine className="w-3 h-3" /> Disponible
              </span>
            )}
          </div>
          <p className="text-xs text-white/30 mt-0.5">
            {new Date(eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {totalOrg > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[11px] font-mono text-white/30 flex-shrink-0">
                {formatPrice(totalReleased, 'FCFA', '0 FCFA')} / {formatPrice(totalOrg, 'FCFA', '0 FCFA')}
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 text-white/30">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
          {schedules.map((s) => (
            <TrancheRow key={s.id} s={s} onWithdraw={onWithdraw} isLoading={isWithdrawing} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Payout history row ───────────────────────────────────────────────────────
function PayoutRow({ payout }: { payout: OrganizerPayout }) {
  const date    = new Date(payout.processedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const opLabel = payout.operator === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money';
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
        <Check className="w-3.5 h-3.5 text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono font-bold text-green-400 text-sm">{formatPrice(payout.amountReceived ?? payout.amountSent, 'FCFA')}</p>
        <p className="text-xs text-white/30 mt-0.5">{opLabel} · {payout.mobileMoney}</p>
        {payout.transactionRef && (
          <p className="font-mono text-[11px] text-white/15 truncate mt-0.5">Réf : {payout.transactionRef}</p>
        )}
      </div>
      <p className="text-[11px] text-white/25 flex-shrink-0">{date}</p>
    </div>
  );
}

// ─── Debt card ────────────────────────────────────────────────────────────────
function DebtCard({ debt, onRetry, isRetrying }: {
  debt: OrganizerDebt;
  onRetry: (debt: OrganizerDebt) => void;
  isRetrying: boolean;
}) {
  const isPaid   = debt.status === 'PAID';
  const isWaived = debt.status === 'WAIVED';
  const isPending = debt.status === 'PENDING' || debt.status === 'COLLECT_FAILED';
  const isInitiated = debt.status === 'COLLECT_INITIATED';

  const date = new Date(debt.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className={`glass-card border overflow-hidden ${
      isPaid || isWaived ? 'border-green-500/20' : isInitiated ? 'border-amber-500/20' : 'border-rose-neon/30'
    }`}>
      <div className="px-4 py-4 flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPaid || isWaived ? 'bg-green-500/10' : isInitiated ? 'bg-amber-500/10' : 'bg-rose-neon/10'
        }`}>
          {isPaid || isWaived
            ? <Check className="w-4 h-4 text-green-400" />
            : isInitiated
              ? <Clock className="w-4 h-4 text-amber-400" />
              : <AlertTriangle className="w-4 h-4 text-rose-neon" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white truncate">{debt.eventTitle}</p>
              <p className="text-xs text-white/30 mt-0.5">{date}</p>
            </div>
            <p className={`font-mono font-bold text-base flex-shrink-0 ${
              isPaid || isWaived ? 'text-green-400 line-through opacity-50' : 'text-rose-neon'
            }`}>
              {formatPrice(debt.totalDue, 'FCFA')}
            </p>
          </div>

          <div className="mt-2.5">
            {isPaid && (
              <span className="inline-flex items-center gap-1 text-xs text-green-400 font-semibold">
                <Check className="w-3.5 h-3.5" /> Remboursé
              </span>
            )}
            {isWaived && (
              <span className="inline-flex items-center gap-1 text-xs text-green-400 font-semibold">
                <Check className="w-3.5 h-3.5" /> Annulé par BilletGo
              </span>
            )}
            {isInitiated && (
              <p className="text-xs text-amber-300/70 leading-relaxed">
                Demande de paiement envoyée sur votre Mobile Money. Confirmez l'OTP sur votre téléphone.
                Si la demande a expiré, cliquez sur "Renvoyer".
              </p>
            )}
            {isPending && (
              <p className="text-xs text-white/40 leading-relaxed">
                {debt.collectAttempts > 0
                  ? `${debt.collectAttempts} tentative(s) échouée(s). Assurez-vous d'avoir les fonds sur votre Mobile Money puis cliquez sur "Payer maintenant".`
                  : 'En attente de paiement. Cliquez sur "Payer maintenant" pour régulariser.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {(isPending || isInitiated) && (
        <div className="px-4 py-3 border-t border-white/[0.05] bg-white/[0.01] flex justify-end">
          <button
            onClick={() => onRetry(debt)}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-neon text-white text-xs font-bold hover:bg-rose-neon/80 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRetrying
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />
            }
            {isInitiated ? 'Renvoyer' : 'Payer maintenant'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Versements() {
  const { data: payoutsData, isLoading: payoutsLoading } = useOrganizerPayouts();
  const { data: profile,     isLoading: profileLoading } = useOrganizerProfile();
  const { data: scheduleData, isLoading: schedulesLoading, refetch: refetchSchedules } = useOrganizerPayoutSchedules();
  const { data: debts,        isLoading: debtsLoading }  = useOrganizerDebts();
  const retryMutation = useRetryDebtCollect();
  useOrganizerStats();
  const { data: rates }                                  = usePlatformRates();
  const qc = useQueryClient();

  const [retryingDebtId, setRetryingDebtId] = useState<string | null>(null);

  const handleRetryDebt = async (debt: OrganizerDebt) => {
    setRetryingDebtId(debt.id);
    try {
      const result = await retryMutation.mutateAsync({ debtId: debt.id });
      toast.success(result.message ?? 'Demande envoyée. Confirmez l\'OTP sur votre téléphone.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Échec de l\'envoi. Réessayez dans quelques minutes.';
      toast.error(msg);
    } finally {
      setRetryingDebtId(null);
    }
  };

  const [withdrawCtx, setWithdrawCtx]             = useState<WithdrawContext | null>(null);
  const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(null);
  const [pendingGeneral, setPendingGeneral]       = useState(false);
  const [withdrawing]                             = useState(false);

  const openScheduleWithdraw = (s: PayoutScheduleEntry) => {
    setPendingScheduleId(s.id);
    setPendingGeneral(false);
    setWithdrawCtx({
      grossAmount:      s.trancheAmount,
      airtelPayoutRate: rates?.airtelPayoutRate ?? 0.01,
      moovPayoutRate:   rates?.moovPayoutRate   ?? 0.01,
      label:            `T${s.tranche} · ${s.event.title}`,
    });
  };

  const openGeneralWithdraw = () => {
    setPendingGeneral(true);
    setPendingScheduleId(null);
    setWithdrawCtx({
      grossAmount:      payoutsData?.balanceDue ?? 0,
      airtelPayoutRate: rates?.airtelPayoutRate ?? 0.01,
      moovPayoutRate:   rates?.moovPayoutRate   ?? 0.01,
      label:            'Solde disponible',
    });
  };

  const handleConfirm = async (phone: string, operator: 'AIRTEL_MONEY' | 'MOOV_MONEY', amount: number) => {
    if (pendingScheduleId) {
      return api.post(`/organizer/payout-schedules/${pendingScheduleId}/withdraw`, { phone, operator, amount }).then((r) => r.data);
    }
    if (pendingGeneral) {
      return api.post('/organizer/payouts/request', { phone, operator, amount }).then((r) => r.data);
    }
    throw new Error('Aucun retrait en attente');
  };

  const handleClose = () => {
    refetchSchedules();
    qc.invalidateQueries('organizer-payouts');
    setWithdrawCtx(null);
    setPendingScheduleId(null);
    setPendingGeneral(false);
  };

  const tier     = profile?.tier ?? 'NEW';
  const tierMeta = TIER_META[tier] ?? TIER_META.NEW;
  const perks    = TIER_PERKS[tier] ?? TIER_PERKS.NEW;
  const { Icon: TierIcon } = tierMeta;

  const balanceDue       = payoutsData?.balanceDue       ?? 0;
  const totalCollected   = payoutsData?.totalCollected   ?? 0;
  const totalPlatformFee = payoutsData?.totalPlatformFee ?? 0;
  const totalNetAmount   = payoutsData?.totalNetAmount   ?? 0;
  const totalPaid        = payoutsData?.totalPaid        ?? 0;
  const historyPayouts   = payoutsData?.payouts          ?? [];

  // Grouper les tranches par événement
  const schedulesByEvent: Record<string, { title: string; eventDate: string; schedules: PayoutScheduleEntry[] }> = {};
  for (const s of scheduleData?.schedules ?? []) {
    if (!schedulesByEvent[s.eventId]) {
      schedulesByEvent[s.eventId] = { title: s.event.title, eventDate: s.event.eventDate, schedules: [] };
    }
    schedulesByEvent[s.eventId].schedules.push(s);
  }

  const hasSchedules    = Object.keys(schedulesByEvent).length > 0;
  const hasAnyEligible  = (scheduleData?.schedules ?? []).some(
    (s) => s.isEligible && s.status === 'PENDING' && s.trancheAmount > 0
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between gap-3"
      >
        {profileLoading ? <SkeletonVersementsHeader /> : (
          <>
            <div>
              <h1 className="font-bebas text-4xl tracking-wider text-gradient leading-none">MES VERSEMENTS</h1>
              <p className="text-xs text-white/30 mt-1">Retraits Mobile Money — Airtel ou Moov</p>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${tierMeta.bg} ${tierMeta.border} ${tierMeta.color}`}>
              <TierIcon className="w-3.5 h-3.5" />
              {tierMeta.label}
            </div>
          </>
        )}
      </motion.div>

      {/* ── KPIs ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        {payoutsLoading ? <SkeletonKpiGrid count={4} /> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total collecté',    value: formatPrice(totalCollected,   'FCFA', '0 FCFA'), Icon: TrendingUp,   color: 'border-cyan-neon/20 bg-cyan-neon/5',     icon: 'text-cyan-neon'   },
              { label: 'Commission',        value: formatPrice(totalPlatformFee, 'FCFA', '0 FCFA'), Icon: TrendingDown, color: 'border-rose-neon/20 bg-rose-neon/5',     icon: 'text-rose-neon'   },
              { label: 'Net organisateur',  value: formatPrice(totalNetAmount,   'FCFA', '0 FCFA'), Icon: Banknote,     color: 'border-violet-neon/20 bg-violet-neon/5', icon: 'text-violet-neon' },
              { label: 'Déjà retiré',       value: formatPrice(totalPaid,        'FCFA', '0 FCFA'), Icon: CheckCheck,   color: 'border-green-500/20 bg-green-500/5',     icon: 'text-green-400'   },
            ].map(({ label, value, Icon, color, icon }) => (
              <div key={label} className={`glass-card p-4 border ${color}`}>
                <Icon className={`w-4 h-4 mb-2 ${icon}`} />
                <p className="text-[11px] text-white/40 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="font-mono font-bold text-base text-white leading-tight">{value}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Calendrier des versements ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-4">
        {schedulesLoading ? (
          <>
            <div className="space-y-1.5">
              <div className="h-6 w-56 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-3 w-40 bg-white/5 rounded-lg animate-pulse" />
            </div>
            <SkeletonEventPayoutCard />
            <SkeletonEventPayoutCard />
          </>
        ) : hasSchedules ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bebas text-2xl tracking-wider text-white leading-none">Calendrier des versements</h2>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {perks.map((p) => (
                    <span key={p.day} className="text-xs text-white/30">
                      <span className={`font-semibold ${tierMeta.color}`}>{p.day}</span>
                      {' '}jusqu'à <span className={`font-semibold ${tierMeta.color}`}>{p.label}</span>
                    </span>
                  ))}
                </div>
              </div>
              {hasAnyEligible && (
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-neon/10 border border-violet-neon/30 text-violet-neon text-xs font-bold">
                  <ArrowDownToLine className="w-3.5 h-3.5" /> Retrait disponible
                </span>
              )}
            </div>
            <div className="space-y-3">
              {Object.values(schedulesByEvent).map((group) => (
                <EventPayoutCard
                  key={group.title}
                  eventTitle={group.title}
                  eventDate={group.eventDate}
                  schedules={group.schedules}
                  onWithdraw={openScheduleWithdraw}
                  isWithdrawing={withdrawing}
                />
              ))}
            </div>
          </>
        ) : null}
      </motion.div>

      {/* ── Solde orphelin (sans tranches) ── */}
      {payoutsLoading ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <SkeletonBalanceCard />
        </motion.div>
      ) : !hasSchedules && balanceDue > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="glass-card overflow-hidden border border-violet-neon/30"
        >
          <div className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1.5">Solde disponible</p>
              <p className="font-mono font-bold text-3xl text-violet-neon leading-none">{formatPrice(balanceDue, 'FCFA')}</p>
            </div>
            <button
              onClick={openGeneralWithdraw}
              className="flex flex-col items-center gap-1.5 px-5 py-3.5 rounded-xl bg-violet-neon text-white font-bold hover:bg-violet-neon/80 active:scale-95 transition-all flex-shrink-0"
            >
              <ArrowDownToLine className="w-5 h-5" />
              <span className="text-xs">Retirer</span>
            </button>
          </div>
          <div className="px-5 py-2.5 border-t border-white/5 bg-white/[0.015]">
            <p className="text-[11px] text-white/25">Virement Mobile Money immédiat.</p>
          </div>
        </motion.div>
      )}

      {/* ── Dettes organisateur ── */}
      {(debtsLoading || (debts && debts.length > 0)) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-neon" />
            <h2 className="font-bebas text-2xl tracking-wider text-white leading-none">Remboursements dus</h2>
          </div>
          {debtsLoading ? (
            <div className="glass-card border border-rose-neon/20 p-4 animate-pulse">
              <div className="h-4 w-48 bg-white/5 rounded mb-2" />
              <div className="h-3 w-32 bg-white/5 rounded" />
            </div>
          ) : (
            <div className="space-y-2">
              {debts!.filter((d) => d.status !== 'PAID' && d.status !== 'WAIVED').map((d) => (
                <DebtCard
                  key={d.id}
                  debt={d}
                  onRetry={handleRetryDebt}
                  isRetrying={retryingDebtId === d.id}
                />
              ))}
              {debts!.filter((d) => d.status === 'PAID' || d.status === 'WAIVED').map((d) => (
                <DebtCard
                  key={d.id}
                  debt={d}
                  onRetry={handleRetryDebt}
                  isRetrying={false}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Historique ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="space-y-3">
        {payoutsLoading ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/5 animate-pulse" />
              <div className="h-6 w-28 bg-white/5 rounded-lg animate-pulse" />
            </div>
            <div className="glass-card overflow-hidden border border-white/[0.06] divide-y divide-white/[0.04]">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonPayoutHistoryRow key={i} />
              ))}
            </div>
          </>
        ) : historyPayouts.length > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-white/30" />
              <h2 className="font-bebas text-2xl tracking-wider text-white leading-none">Historique</h2>
            </div>
            <div className="glass-card overflow-hidden border border-white/[0.06] divide-y divide-white/[0.04]">
              {historyPayouts.map((p) => <PayoutRow key={p.id} payout={p} />)}
            </div>
          </>
        ) : null}
      </motion.div>

      {/* ── Support ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex items-center gap-3 px-4 py-3.5 glass-card border border-white/[0.06] rounded-2xl"
      >
        <div className="w-8 h-8 rounded-xl bg-violet-neon/10 flex items-center justify-center flex-shrink-0">
          <Mail className="w-4 h-4 text-violet-neon" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Une question sur vos versements ?</p>
          <a href="mailto:support@billetgo.net"
            className="text-xs text-violet-neon hover:text-violet-neon/70 underline underline-offset-2 transition-colors"
          >
            support@billetgo.net
          </a>
        </div>
      </motion.div>

      {/* ── Modal retrait ── */}
      <WithdrawModal
        context={withdrawCtx}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />

    </div>
  );
}
