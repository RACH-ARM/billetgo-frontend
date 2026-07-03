import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote, Check, Mail, Wallet,
  TrendingUp, TrendingDown, CheckCheck,
  History, CalendarDays, Clock, XCircle, AlertTriangle,
  Smartphone, ArrowDownLeft, Ticket,
} from 'lucide-react';
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
            {formatPrice(payout.amountSent, 'FCFA')}
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
  const opLabel  = sale.provider === 'AIRTEL_MONEY' ? 'Airtel Money' : sale.provider === 'MOOV_MONEY' ? 'Moov Money' : null;
  const opColor  = sale.provider === 'AIRTEL_MONEY' ? 'text-rose-neon' : 'text-cyan-neon';

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
        <ArrowDownLeft className="w-3.5 h-3.5 text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-mono font-bold text-sm text-green-400">
            +{formatPrice(sale.organizerAmount, 'FCFA')}
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-semibold leading-none">
            Confirmé
          </span>
        </div>
        <p className="text-xs text-white/60 mt-0.5 truncate">{sale.buyerName}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] text-white/25 truncate max-w-[140px]">{sale.eventTitle}</span>
          {opLabel && <span className={`text-[11px] ${opColor} flex-shrink-0`}>{opLabel}</span>}
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

// ─── Operator balance card ────────────────────────────────────────────────────

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
  const isAirtel    = operator === 'AIRTEL_MONEY';
  const label       = isAirtel ? 'Airtel Money' : 'Moov Money';
  const color       = isAirtel ? 'text-rose-neon'  : 'text-cyan-neon';
  const border      = isAirtel ? 'border-rose-neon' : 'border-cyan-neon';
  const bg          = isAirtel ? 'bg-rose-neon/10'  : 'bg-cyan-neon/10';
  const iconColor   = isAirtel ? 'text-rose-neon'   : 'text-cyan-neon';

  const canWithdraw = balance > 0;

  return (
    <button
      onClick={onClick}
      disabled={!canWithdraw}
      className={`glass-card p-4 border text-left transition-all active:scale-95 disabled:cursor-default w-full ${
        canWithdraw
          ? `${border}/40 ${bg} hover:opacity-90 cursor-pointer`
          : 'border-white/[0.06]'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${bg}`}>
          <Smartphone className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <span className={`font-bebas text-sm tracking-wider ${canWithdraw ? color : 'text-white/30'}`}>
          {label}
        </span>
      </div>
      <p className={`font-mono font-bold text-xl leading-tight ${canWithdraw ? color : 'text-white/20'}`}>
        {formatPrice(balance, 'FCFA', '0 FCFA')}
      </p>
      {phone && <p className="text-[11px] text-white/30 mt-1 font-mono truncate">{phone}</p>}
      {canWithdraw && <p className={`text-[10px] mt-1.5 ${color}/60`}>Appuyer pour retirer</p>}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Versements() {
  const { data: payoutsData, isLoading: payoutsLoading } = useOrganizerPayouts();
  const { isLoading: profileLoading } = useOrganizerProfile();
  const qc = useQueryClient();

  const [withdrawCtx, setWithdrawCtx] = useState<WithdrawContext | null>(null);
  const [historyTab, setHistoryTab] = useState<'sales' | 'payouts'>('sales');

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

      {/* ── KPIs ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        {payoutsLoading ? <SkeletonKpiGrid count={4} /> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          </div>
        )}
      </motion.div>

      {/* ── Solde par opérateur ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="space-y-3">
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

      {/* ── Historique des transactions ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-white/30" />
          <h2 className="font-bebas text-2xl tracking-wider text-white leading-none">Historique</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/[0.06]">
          <button
            onClick={() => setHistoryTab('sales')}
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
            onClick={() => setHistoryTab('payouts')}
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
        ) : historyTab === 'sales' ? (
          recentSales.length > 0 ? (
            <div className="glass-card overflow-hidden border border-green-500/10 divide-y divide-white/[0.04]">
              {recentSales.map((s) => <SaleRow key={s.id} sale={s} />)}
            </div>
          ) : (
            <div className="glass-card border border-white/[0.06] p-8 text-center">
              <p className="text-white/30 text-sm">Aucune vente pour le moment</p>
            </div>
          )
        ) : (
          historyPayouts.filter((p) => p.pvitStatus !== 'ADJUSTMENT').length > 0 ? (
            <div className="glass-card overflow-hidden border border-violet-neon/10 divide-y divide-white/[0.04]">
              {historyPayouts.filter((p) => p.pvitStatus !== 'ADJUSTMENT').map((p) => <PayoutRow key={p.id} payout={p} />)}
            </div>
          ) : (
            <div className="glass-card border border-white/[0.06] p-8 text-center">
              <p className="text-white/30 text-sm">Aucun retrait effectué</p>
            </div>
          )
        )}
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
