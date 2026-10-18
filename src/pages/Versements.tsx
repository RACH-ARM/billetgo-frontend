import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote, Check, Mail, Wallet,
  TrendingUp, TrendingDown, CheckCheck,
  History, CalendarDays, Clock, XCircle, AlertTriangle,
  Smartphone, ArrowDownLeft, ArrowRight, Ticket, ChevronLeft, ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 10;
import {
  useOrganizerPayouts,
  useOrganizerProfile,
} from '../hooks/useOrganizer';
import { useQueryClient } from 'react-query';
import { type OrganizerPayout, type SaleTransaction } from '../services/organizerService';
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

const PAYOUT_STATUS_CFG = {
  SUCCESS:      { Icon: Check,          bg: 'bg-green-500/10',   text: 'text-green-400',   label: 'Confirmé',   amount: 'text-green-400'          },
  PENDING:      { Icon: Clock,          bg: 'bg-amber-400/10',   text: 'text-amber-400',   label: 'En cours',   amount: 'text-white/50'            },
  PENDING_LOCK: { Icon: Clock,          bg: 'bg-amber-400/10',   text: 'text-amber-400',   label: 'En cours',   amount: 'text-white/50'            },
  FAILED:       { Icon: XCircle,        bg: 'bg-rose-500/10',    text: 'text-rose-400',    label: 'Échoué',     amount: 'text-rose-400/60 line-through' },
  PARTIAL:      { Icon: AlertTriangle,  bg: 'bg-orange-400/10',  text: 'text-orange-400',  label: 'Partiel',    amount: 'text-orange-400'         },
  SCHEDULED:    { Icon: CalendarDays,   bg: 'bg-violet-neon/10', text: 'text-violet-neon', label: 'Programmé',  amount: 'text-white/40'            },
} as const;

function PayoutRow({ payout }: { payout: OrganizerPayout }) {
  const date    = new Date(payout.processedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const opLabel = payout.operator === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money';
  const cfg     = PAYOUT_STATUS_CFG[payout.pvitStatus as keyof typeof PAYOUT_STATUS_CFG]
                  ?? PAYOUT_STATUS_CFG.PENDING;
  const { Icon } = cfg;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-mono font-bold text-sm ${cfg.amount}`}>
            {formatPrice(payout.amountSent, 'FCFA', '0 FCFA')}
          </p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} font-semibold leading-none`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-white/30 mt-0.5">{opLabel} · {payout.mobileMoney}</p>
        {payout.transactionRef && (
          <p className="font-mono text-[11px] text-white/15 truncate mt-0.5">Réf : {payout.transactionRef}</p>
        )}
      </div>
      <p className="text-[11px] text-white/25 flex-shrink-0">{date}</p>
    </div>
  );
}

// ─── Sale transaction row ────────────────────────────────────────────────────

function SaleRow({ sale }: { sale: SaleTransaction }) {
  const date     = new Date(sale.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const time     = new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const pm = sale.paymentMethod ?? sale.provider;
  const opLabel = pm === 'CASH' ? 'Espèces' : pm === 'AIRTEL_MONEY' ? 'Airtel Money' : pm === 'MOOV_MONEY' ? 'Moov Money' : null;
  const opColor = pm === 'CASH' ? 'text-amber-400' : pm === 'AIRTEL_MONEY' ? 'text-rose-neon' : 'text-cyan-neon';
  const channelLabel = sale.saleChannel === 'POS' ? '· Agent' : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
        <ArrowDownLeft className="w-3.5 h-3.5 text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-mono font-bold text-sm text-green-400">
            +{formatPrice(sale.organizerAmount, 'FCFA', '0 FCFA')}
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-semibold leading-none">
            Confirmé
          </span>
        </div>
        <p className="text-xs text-white/60 mt-0.5 truncate">{sale.buyerName}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] text-white/25 truncate max-w-[140px]">{sale.eventTitle}</span>
          {opLabel && <span className={`text-[11px] ${opColor} flex-shrink-0`}>{opLabel}</span>}
          {channelLabel && <span className="text-[11px] text-white/20 flex-shrink-0">{channelLabel}</span>}
          <span className="text-[11px] text-white/20 flex-shrink-0 flex items-center gap-0.5">
            <Ticket className="w-2.5 h-2.5" />
            {sale.ticketCount}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-white/25 flex-shrink-0 text-right">
        <span className="block">{date}</span>
        <span className="block">{time}</span>
      </p>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function Pagination({ page, total, onPrev, onNext }: {
  page: number; total: number; onPrev: () => void; onNext: () => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04]">
      <span className="text-[11px] text-white/25">{start}–{end} sur {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-default transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[11px] text-white/40 px-2 font-mono">{page} / {totalPages}</span>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-default transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Operator balance card — carte héros/action ───────────────────────────────
// C'est la raison d'être de cette page : combien l'organisateur peut retirer,
// maintenant, par opérateur. Traitement visuel fort, pas un simple KPI passif.

function OperatorBalanceCard({
  operator,
  balance,
  phone,
  onClick,
}: {
  operator: 'AIRTEL_MONEY' | 'MOOV_MONEY';
  balance: number;
  phone: string | null;
  onClick: () => void;
}) {
  const isAirtel  = operator === 'AIRTEL_MONEY';
  const label     = isAirtel ? 'Airtel Money' : 'Moov Money';
  const color     = isAirtel ? 'text-rose-neon'   : 'text-cyan-neon';
  const border    = isAirtel ? 'border-rose-neon'  : 'border-cyan-neon';
  const bg        = isAirtel ? 'bg-rose-neon/10'   : 'bg-cyan-neon/10';
  const glow      = isAirtel ? 'bg-rose-neon/15'   : 'bg-cyan-neon/15';

  const canWithdraw = balance > 0;

  return (
    <button
      onClick={onClick}
      disabled={!canWithdraw}
      className={`relative overflow-hidden glass-card p-5 border text-left w-full transition-colors active:scale-[0.98] disabled:cursor-default ${
        canWithdraw ? `${border}/30 hover:${border}/50` : 'border-white/[0.06]'
      }`}
    >
      {canWithdraw && (
        <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${glow} blur-2xl`} />
      )}
      <div className="relative flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${canWithdraw ? bg : 'bg-white/5'}`}>
            <Smartphone className={`w-4.5 h-4.5 ${canWithdraw ? color : 'text-white/20'}`} />
          </div>
          <span className={`font-bebas text-base tracking-wider ${canWithdraw ? color : 'text-white/30'}`}>
            {label}
          </span>
        </div>
        {canWithdraw && <ArrowRight className={`w-4 h-4 ${color} opacity-60`} />}
      </div>
      <p className={`relative font-bebas text-3xl sm:text-4xl tabular-nums leading-none ${canWithdraw ? color : 'text-white/20'}`}>
        {formatPrice(balance, 'FCFA', '0 FCFA')}
      </p>
      {phone && <p className="relative text-[11px] text-white/30 mt-2.5 font-mono truncate">{phone}</p>}
      <p className={`relative text-[11px] mt-1 font-semibold ${canWithdraw ? `${color}/70` : 'text-white/20'}`}>
        {canWithdraw ? 'Appuyer pour retirer' : 'Aucun solde disponible'}
      </p>
    </button>
  );
}

// ─── Mini stat — récapitulatif financier (secondaire) ─────────────────────────

function MiniStat({ label, value, Icon, color, bg }: {
  label: string; value: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string;
}) {
  return (
    <div className="glass-card p-4 border border-white/[0.06] flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-white/40 uppercase tracking-widest truncate leading-none mb-1">{label}</p>
        <p className="font-mono font-bold text-sm text-white tabular-nums leading-none">{value}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Versements() {
  const { data: payoutsData, isLoading: payoutsLoading } = useOrganizerPayouts();
  const { isLoading: profileLoading } = useOrganizerProfile();
  const qc = useQueryClient();

  const [withdrawCtx, setWithdrawCtx] = useState<WithdrawContext | null>(null);
  const [historyTab, setHistoryTab] = useState<'sales' | 'payouts'>('sales');
  const [salesPage,  setSalesPage]  = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);

  const switchTab = (tab: 'sales' | 'payouts') => {
    setHistoryTab(tab);
    setSalesPage(1);
    setPayoutsPage(1);
  };

  const openWithdrawForOperator = (operator: 'AIRTEL_MONEY' | 'MOOV_MONEY') => {
    const balance = operator === 'AIRTEL_MONEY'
      ? (payoutsData?.airtelBalance ?? 0)
      : (payoutsData?.moovBalance ?? 0);
    if (balance <= 0) return;
    // Le numéro de profil pré-remplit le champ, mais l'organisateur peut saisir n'importe quel numéro
    const defaultPhone = operator === 'AIRTEL_MONEY'
      ? (payoutsData?.airtelNumber ?? undefined)
      : (payoutsData?.moovNumber ?? undefined);
    setWithdrawCtx({
      grossAmount:      balance,
      defaultOperator:  operator,
      defaultPhone,
      airtelPayoutRate: 0.005,
      moovPayoutRate:   0.01,
      label:            operator === 'AIRTEL_MONEY' ? 'Solde Airtel Money' : 'Solde Moov Money',
    });
  };

  const handleConfirm = async (phone: string, operator: 'AIRTEL_MONEY' | 'MOOV_MONEY', amount: number) => {
    return api.post('/organizer/payouts/request', { phone, operator, amount }).then((r) => r.data);
  };

  const handleClose = () => {
    qc.invalidateQueries('organizer-payouts');
    setWithdrawCtx(null);
  };

  const totalCollected   = payoutsData?.totalCollected   ?? 0;
  const totalPlatformFee = payoutsData?.totalPlatformFee ?? 0;
  const totalNetAmount   = payoutsData?.totalNetAmount   ?? 0;
  const totalPaid        = payoutsData?.totalPaid        ?? 0;
  const airtelBalance    = payoutsData?.airtelBalance    ?? 0;
  const moovBalance      = payoutsData?.moovBalance      ?? 0;
  const airtelNumber     = payoutsData?.airtelNumber     ?? null;
  const moovNumber       = payoutsData?.moovNumber       ?? null;
  const historyPayouts   = payoutsData?.payouts          ?? [];
  const recentSales      = payoutsData?.recentSales      ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        {profileLoading ? <SkeletonVersementsHeader /> : (
          <div>
            <h1 className="font-bebas text-4xl tracking-wider text-gradient leading-none">MES VERSEMENTS</h1>
            <p className="text-xs text-white/30 mt-1">Solde disponible par compte Mobile Money</p>
          </div>
        )}
      </motion.div>

      {/* ── Solde disponible — l'action principale de cette page ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-white/30" />
          <h2 className="font-bebas text-2xl tracking-wider text-white leading-none">Solde disponible</h2>
        </div>

        {payoutsLoading ? <SkeletonKpiGrid count={2} /> : (
          <div className="grid grid-cols-2 gap-3">
            <OperatorBalanceCard
              operator="AIRTEL_MONEY"
              balance={airtelBalance}
              phone={airtelNumber}
              onClick={() => openWithdrawForOperator('AIRTEL_MONEY')}
            />
            <OperatorBalanceCard
              operator="MOOV_MONEY"
              balance={moovBalance}
              phone={moovNumber}
              onClick={() => openWithdrawForOperator('MOOV_MONEY')}
            />
          </div>
        )}
      </motion.div>

      {/* ── Récapitulatif financier (secondaire) ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        {payoutsLoading ? <SkeletonKpiGrid count={4} /> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="Total collecté"   value={formatPrice(totalCollected,   'FCFA', '0 FCFA')} Icon={TrendingUp}   color="text-cyan-neon"   bg="bg-cyan-neon/10" />
            <MiniStat label="Commission"       value={formatPrice(totalPlatformFee, 'FCFA', '0 FCFA')} Icon={TrendingDown} color="text-rose-neon"   bg="bg-rose-neon/10" />
            <MiniStat label="Net organisateur" value={formatPrice(totalNetAmount,   'FCFA', '0 FCFA')} Icon={Banknote}     color="text-violet-neon" bg="bg-violet-neon/10" />
            <MiniStat label="Déjà retiré"      value={formatPrice(totalPaid,        'FCFA', '0 FCFA')} Icon={CheckCheck}   color="text-green-400"   bg="bg-green-500/10" />
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
                  {formatPrice(ev.organizerAmount, 'FCFA', '0 FCFA')}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Historique des transactions ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-white/30" />
          <h2 className="font-bebas text-2xl tracking-wider text-white leading-none">Historique</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/[0.06]">
          <button
            onClick={() => switchTab('sales')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              historyTab === 'sales'
                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Entrées
            {recentSales.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${historyTab === 'sales' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/30'}`}>
                {recentSales.length}
              </span>
            )}
          </button>
          <button
            onClick={() => switchTab('payouts')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              historyTab === 'payouts'
                ? 'bg-violet-neon/15 text-violet-neon border border-violet-neon/20'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            Retraits
            {historyPayouts.filter(p => p.pvitStatus !== 'ADJUSTMENT').length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${historyTab === 'payouts' ? 'bg-violet-neon/20 text-violet-neon/80' : 'bg-white/10 text-white/30'}`}>
                {historyPayouts.filter(p => p.pvitStatus !== 'ADJUSTMENT').length}
              </span>
            )}
          </button>
        </div>

        {payoutsLoading ? (
          <div className="glass-card overflow-hidden border border-white/[0.06] divide-y divide-white/[0.04]">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonPayoutHistoryRow key={i} />
            ))}
          </div>
        ) : historyTab === 'sales' ? (() => {
          const paginated = recentSales.slice((salesPage - 1) * PAGE_SIZE, salesPage * PAGE_SIZE);
          return recentSales.length > 0 ? (
            <div className="glass-card overflow-hidden border border-green-500/10 divide-y divide-white/[0.04]">
              {paginated.map((s) => <SaleRow key={s.id} sale={s} />)}
              <Pagination
                page={salesPage}
                total={recentSales.length}
                onPrev={() => setSalesPage(p => p - 1)}
                onNext={() => setSalesPage(p => p + 1)}
              />
            </div>
          ) : (
            <div className="glass-card border border-white/[0.06] p-8 text-center">
              <p className="text-white/30 text-sm">Aucune vente pour le moment</p>
            </div>
          );
        })() : (() => {
          const filtered  = historyPayouts.filter((p) => p.pvitStatus !== 'ADJUSTMENT');
          const paginated = filtered.slice((payoutsPage - 1) * PAGE_SIZE, payoutsPage * PAGE_SIZE);
          return filtered.length > 0 ? (
            <div className="glass-card overflow-hidden border border-violet-neon/10 divide-y divide-white/[0.04]">
              {paginated.map((p) => <PayoutRow key={p.id} payout={p} />)}
              <Pagination
                page={payoutsPage}
                total={filtered.length}
                onPrev={() => setPayoutsPage(p => p - 1)}
                onNext={() => setPayoutsPage(p => p + 1)}
              />
            </div>
          ) : (
            <div className="glass-card border border-white/[0.06] p-8 text-center">
              <p className="text-white/30 text-sm">Aucun retrait effectué</p>
            </div>
          );
        })()}
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
