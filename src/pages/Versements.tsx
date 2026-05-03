import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote, Check, Mail, Wallet,
  TrendingUp, TrendingDown, CheckCheck,
  History, CalendarDays,
} from 'lucide-react';
import {
  useOrganizerPayouts,
  useOrganizerProfile,
  usePlatformRates,
} from '../hooks/useOrganizer';
import { useQueryClient } from 'react-query';
import { type OrganizerPayout } from '../services/organizerService';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { formatDateShort } from '../utils/formatDate';
import {
  SkeletonKpiGrid,
  SkeletonVersementsHeader,
  SkeletonPayoutHistoryRow,
} from '../components/common/Skeleton';
import WithdrawModal, { type WithdrawContext } from '../components/common/WithdrawModal';

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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Versements() {
  const { data: payoutsData, isLoading: payoutsLoading } = useOrganizerPayouts();
  const { data: profile,     isLoading: profileLoading } = useOrganizerProfile();
  const { data: rates }                                  = usePlatformRates();
  const qc = useQueryClient();

  const [withdrawCtx, setWithdrawCtx] = useState<WithdrawContext | null>(null);

  const openWithdraw = (presetAmount?: number) => {
    const balance = payoutsData?.balanceDue ?? 0;
    setWithdrawCtx({
      grossAmount:      balance,
      presetAmount:     presetAmount !== undefined ? Math.min(presetAmount, balance) : undefined,
      airtelPayoutRate: rates?.airtelPayoutRate ?? 0.01,
      moovPayoutRate:   rates?.moovPayoutRate   ?? 0.01,
      label:            'Solde disponible',
    });
  };

  const handleConfirm = async (phone: string, operator: 'AIRTEL_MONEY' | 'MOOV_MONEY', amount: number) => {
    return api.post('/organizer/payouts/request', { phone, operator, amount }).then((r) => r.data);
  };

  const handleClose = () => {
    qc.invalidateQueries('organizer-payouts');
    setWithdrawCtx(null);
  };

  const balanceDue       = payoutsData?.balanceDue       ?? 0;
  const totalCollected   = payoutsData?.totalCollected   ?? 0;
  const totalPlatformFee = payoutsData?.totalPlatformFee ?? 0;
  const totalNetAmount   = payoutsData?.totalNetAmount   ?? 0;
  const totalPaid        = payoutsData?.totalPaid        ?? 0;
  const historyPayouts   = payoutsData?.payouts          ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        {profileLoading ? <SkeletonVersementsHeader /> : (
          <div>
            <h1 className="font-bebas text-4xl tracking-wider text-gradient leading-none">MES VERSEMENTS</h1>
            <p className="text-xs text-white/30 mt-1">Retraits Mobile Money — Airtel ou Moov · {profile?.mobileMoneyNumber ?? ''}</p>
          </div>
        )}
      </motion.div>

      {/* ── KPIs ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        {payoutsLoading ? <SkeletonKpiGrid count={5} /> : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {([
              { label: 'Total collecté',   value: formatPrice(totalCollected,   'FCFA', '0 FCFA'), Icon: TrendingUp,  color: 'border-cyan-neon/20 bg-cyan-neon/5',     icon: 'text-cyan-neon'   },
              { label: 'Commission',       value: formatPrice(totalPlatformFee, 'FCFA', '0 FCFA'), Icon: TrendingDown,color: 'border-rose-neon/20 bg-rose-neon/5',     icon: 'text-rose-neon'   },
              { label: 'Net organisateur', value: formatPrice(totalNetAmount,   'FCFA', '0 FCFA'), Icon: Banknote,    color: 'border-violet-neon/20 bg-violet-neon/5', icon: 'text-violet-neon' },
              { label: 'Déjà retiré',      value: formatPrice(totalPaid,        'FCFA', '0 FCFA'), Icon: CheckCheck,  color: 'border-green-500/20 bg-green-500/5',     icon: 'text-green-400'   },
            ] as const).map(({ label, value, Icon, color, icon }) => (
              <div key={label} className={`glass-card p-4 border ${color}`}>
                <Icon className={`w-4 h-4 mb-2 ${icon}`} />
                <p className="text-[11px] text-white/40 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="font-mono font-bold text-base text-white leading-tight">{value}</p>
              </div>
            ))}
            {/* Solde disponible — cliquable pour ouvrir le retrait */}
            <button
              onClick={() => balanceDue > 0 && openWithdraw()}
              disabled={balanceDue <= 0}
              className={`glass-card p-4 border text-left transition-all active:scale-95 disabled:cursor-default ${
                balanceDue > 0
                  ? 'border-violet-neon/40 bg-violet-neon/10 hover:bg-violet-neon/20 cursor-pointer'
                  : 'border-white/[0.06]'
              }`}
            >
              <Wallet className={`w-4 h-4 mb-2 ${balanceDue > 0 ? 'text-violet-neon' : 'text-white/20'}`} />
              <p className="text-[11px] text-white/40 uppercase tracking-widest leading-none mb-1">Solde disponible</p>
              <p className={`font-mono font-bold text-base leading-tight ${balanceDue > 0 ? 'text-violet-neon' : 'text-white/20'}`}>
                {formatPrice(balanceDue, 'FCFA', '0 FCFA')}
              </p>
              {balanceDue > 0 && <p className="text-[10px] text-violet-neon/50 mt-1">Appuyer pour retirer</p>}
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Gains par événement ── */}
      {!payoutsLoading && payoutsData?.events && payoutsData.events.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-white/30" />
            <h2 className="font-bebas text-2xl tracking-wider text-white leading-none">Gains par événement</h2>
          </div>
          <div className="glass-card overflow-hidden border border-white/[0.06] divide-y divide-white/[0.04]">
            {payoutsData.events.map((ev) => (
              <div key={ev.eventId} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{ev.eventTitle}</p>
                  <p className="text-xs text-white/30 mt-0.5">{formatDateShort(ev.eventDate)}</p>
                </div>
                <p className="font-mono font-bold text-violet-neon text-sm flex-shrink-0">
                  {formatPrice(ev.organizerAmount, 'FCFA')}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}


      {/* ── Historique ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-3">
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
              {historyPayouts.filter((p) => p.pvitStatus !== 'ADJUSTMENT').map((p) => <PayoutRow key={p.id} payout={p} />)}
            </div>
          </>
        ) : null}
      </motion.div>

      {/* ── Support ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="flex items-center gap-3 px-4 py-3.5 glass-card border border-white/[0.06] rounded-2xl"
      >
        <div className="w-8 h-8 rounded-xl bg-violet-neon/10 flex items-center justify-center flex-shrink-0">
          <Mail className="w-4 h-4 text-violet-neon" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Une question sur vos versements ?</p>
          <a href="mailto:billetgab01@gmail.com"
            className="text-xs text-violet-neon hover:text-violet-neon/70 underline underline-offset-2 transition-colors"
          >
            billetgab01@gmail.com
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
