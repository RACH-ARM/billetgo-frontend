import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote, Phone, Check, X, MessageCircle, AlertTriangle,
  TrendingUp, TrendingDown, Clock, CheckCheck, Star, Award, Shield, Zap,
} from 'lucide-react';
import { useOrganizerPayouts, useOrganizerProfile, useUpdateProfile, useOrganizerPayoutSchedules, useOrganizerStats } from '../hooks/useOrganizer';
import { type OrganizerPayoutSummary, type OrganizerPayout, type PayoutScheduleEntry, type OrganizerEventStat } from '../services/organizerService';
import { formatPrice } from '../utils/formatPrice';
import { SkeletonKpiGrid, SkeletonCard } from '../components/common/Skeleton';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

// Silence unused type imports — they document the shape used in this file.
type _Summary = OrganizerPayoutSummary;
type _Payout = OrganizerPayout;
type _Schedule = PayoutScheduleEntry;

const SUPPORT_WHATSAPP =
  (import.meta as { env: Record<string, string> }).env.VITE_SUPPORT_WHATSAPP || '24177000000';

// ── KPI card ──────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: 'cyan' | 'rose' | 'violet' | 'green';
}

function KpiCard({ label, value, Icon, color }: KpiCardProps) {
  const styles: Record<string, { icon: string; border: string }> = {
    cyan:   { icon: 'bg-cyan-neon/10 text-cyan-neon',     border: 'border-cyan-neon/20' },
    rose:   { icon: 'bg-rose-neon/10 text-rose-neon',     border: 'border-rose-neon/20' },
    violet: { icon: 'bg-violet-neon/10 text-violet-neon', border: 'border-violet-neon/20' },
    green:  { icon: 'bg-green-500/10 text-green-400',     border: 'border-green-500/20' },
  };
  const s = styles[color];

  return (
    <div className={`glass-card p-4 border ${s.border}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.icon}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-mono font-bold text-lg text-white leading-tight">{value}</p>
    </div>
  );
}

// ── Payout row ────────────────────────────────────────────────
function PayoutRow({ payout }: { payout: OrganizerPayout }) {
  const date = new Date(payout.processedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
        <Check className="w-4 h-4 text-green-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-mono font-bold text-green-400 text-lg leading-tight">
          {formatPrice(payout.amountSent, 'FCFA')}
        </p>
        <p className="text-xs text-white/40 mt-0.5">
          {payout.operator} &mdash; {payout.mobileMoney}
        </p>
        {payout.transactionRef && (
          <p className="font-mono text-xs text-white/30 mt-0.5 truncate">
            Réf : {payout.transactionRef}
          </p>
        )}
      </div>

      <p className="text-xs text-white/30 flex-shrink-0">{date}</p>
    </div>
  );
}

// ── Tier badge ────────────────────────────────────────────────
const TIER_META: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.ComponentType<{ className?: string }> }> = {
  NEW:       { label: 'Nouveau',  color: 'text-white/50',    bg: 'bg-white/5',         border: 'border-white/10',       Icon: Star   },
  APPROVED:  { label: 'Approuvé', color: 'text-cyan-neon',   bg: 'bg-cyan-neon/10',    border: 'border-cyan-neon/20',   Icon: Shield },
  CERTIFIED: { label: 'Certifié', color: 'text-violet-neon', bg: 'bg-violet-neon/10',  border: 'border-violet-neon/20', Icon: Award  },
  PREMIUM:   { label: 'Premium',  color: 'text-yellow-400',  bg: 'bg-yellow-400/10',   border: 'border-yellow-400/20',  Icon: Zap    },
};

const TIER_PERKS: Record<string, string> = {
  NEW:       'Versement en 2 tranches — jusqu\'à 70% des ventes à J-3, solde à J+7',
  APPROVED:  'Versement en 3 tranches — jusqu\'à 40% à J-14, 80% à J-3, 100% à J+7',
  CERTIFIED: 'Versement en 3 tranches — jusqu\'à 60% à J-14, 90% à J-3, 100% à J+7',
  PREMIUM:   'Versement en 3 tranches — jusqu\'à 80% à J-14, 95% à J-3, 100% à J+7',
};

function TierBadge({ tier }: { tier: string }) {
  const meta = TIER_META[tier] ?? TIER_META.NEW;
  const { Icon } = meta;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${meta.bg} ${meta.border} ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </div>
  );
}

// ── Schedule section ──────────────────────────────────────────
function ScheduleRow({ s }: { s: PayoutScheduleEntry }) {
  const date = new Date(s.scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const isPast = s.isEligible;
  const isReleased = s.status === 'RELEASED';
  const isCancelled = s.status === 'CANCELLED';

  return (
    <div className={`px-4 py-3 ${isReleased ? 'bg-green-500/[0.03]' : isPast ? 'bg-yellow-500/[0.03]' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Tranche {s.tranche} — jusqu'à {Math.round(s.percentage * 100)}% des ventes
          </p>
          <p className="text-xs text-white/30 mt-0.5 font-mono">{date}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {isReleased ? (
            <>
              <p className="font-mono font-bold text-green-400 text-base">{formatPrice(s.amountReleased ?? 0, 'FCFA')}</p>
              <span className="flex items-center justify-end gap-1 text-xs text-green-400 mt-0.5">
                <Check className="w-3 h-3" /> Versé
              </span>
            </>
          ) : isCancelled ? (
            <span className="text-xs text-white/30 flex items-center gap-1"><X className="w-3 h-3" /> Annulé</span>
          ) : s.totalOrganizerAmount > 0 ? (
            <>
              <p className="font-mono font-bold text-white/70 text-base">{formatPrice(s.trancheAmount, 'FCFA')}</p>
              {isPast ? (
                <span className="flex items-center justify-end gap-1 text-xs text-yellow-400 mt-0.5">
                  <Clock className="w-3 h-3" /> En attente
                </span>
              ) : (
                <span className="text-xs text-white/30 mt-0.5">Programmé</span>
              )}
            </>
          ) : (
            <span className="text-xs text-white/30">En attente des ventes</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tier schedule config (miroir du backend payoutService.ts) ─
const TIER_SCHEDULES: Record<string, { tranche: number; dayOffset: number; cumPct: number }[]> = {
  NEW:       [{ tranche: 2, dayOffset: -3,  cumPct: 0.70 }, { tranche: 3, dayOffset:  7, cumPct: 1.00 }],
  APPROVED:  [{ tranche: 1, dayOffset: -14, cumPct: 0.40 }, { tranche: 2, dayOffset: -3, cumPct: 0.80 }, { tranche: 3, dayOffset: 7, cumPct: 1.00 }],
  CERTIFIED: [{ tranche: 1, dayOffset: -14, cumPct: 0.60 }, { tranche: 2, dayOffset: -3, cumPct: 0.90 }, { tranche: 3, dayOffset: 7, cumPct: 1.00 }],
  PREMIUM:   [{ tranche: 1, dayOffset: -14, cumPct: 0.80 }, { tranche: 2, dayOffset: -3, cumPct: 0.95 }, { tranche: 3, dayOffset: 7, cumPct: 1.00 }],
};

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

interface SimTranche { tranche: number; date: Date; cumPct: number; trancheAmount: number; isPast: boolean; }

function getSimulatedTranches(eventDate: string, tier: string, totalRevenue: number): SimTranche[] {
  const base = new Date(eventDate);
  const schedule = TIER_SCHEDULES[tier] ?? TIER_SCHEDULES.NEW;
  const now = new Date();
  let prevPct = 0;
  return schedule.map(({ tranche, dayOffset, cumPct }) => {
    const date = addDays(base, dayOffset);
    const trancheAmount = Math.max(0, Math.round(totalRevenue * (cumPct - prevPct)));
    prevPct = cumPct;
    return { tranche, date, cumPct, trancheAmount, isPast: date <= now };
  });
}

// ── Simulation block (événement non encore publié) ────────────
const PRE_PUBLISH = ['DRAFT', 'PENDING_REVIEW', 'NEEDS_REVISION', 'APPROVED'];

function SimulatedEventBlock({ event, tier }: { event: OrganizerEventStat; tier: string }) {
  const tranches = getSimulatedTranches(event.eventDate, tier, event.totalRevenue);
  const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="glass-card overflow-hidden border border-dashed border-white/10">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/70 truncate">{event.title}</p>
          <p className="text-xs text-white/30 mt-0.5">{new Date(event.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/30 font-semibold">
          Estimation
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {tranches.map((t) => (
          <div key={t.tranche} className="flex items-center justify-between px-4 py-3 gap-3">
            <div>
              <p className="text-xs text-white/50">
                Tranche {t.tranche} — jusqu'à {Math.round(t.cumPct * 100)}% des ventes
              </p>
              <p className="text-xs text-white/25 font-mono mt-0.5">{fmtDate(t.date)}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {event.totalRevenue > 0 ? (
                <p className="font-mono text-white/40 text-sm font-semibold">{formatPrice(t.trancheAmount, 'FCFA')}</p>
              ) : (
                <p className="text-xs text-white/20">— aucune vente</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {event.totalRevenue > 0 && (
        <p className="px-4 py-2 text-[10px] text-white/20 border-t border-white/5">
          Estimation basée sur {formatPrice(event.totalRevenue, 'FCFA')} de revenus nets actuels — le montant réel dépendra des ventes au moment du versement.
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Versements() {
  const { data, isLoading } = useOrganizerPayouts();
  const { data: profile, isLoading: profileLoading } = useOrganizerProfile();
  const { data: scheduleData } = useOrganizerPayoutSchedules();
  const { data: statsData } = useOrganizerStats();
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  const handleSavePhone = async () => {
    // Garder uniquement les chiffres (retire +, espaces, tirets, indicatif pays)
    const digits = phoneInput.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      toast.error('Numéro invalide — saisir entre 8 et 15 chiffres (ex: 077000000)');
      return;
    }
    try {
      await updateProfile.mutateAsync({ mobileMoneyNumber: digits });
      toast.success('Numéro enregistré avec succès.');
      setEditing(false);
      setPhoneInput('');
    } catch {
      toast.error('Impossible d\'enregistrer le numéro. Réessayez.');
    }
  };

  const showEdit = editing || !profile?.mobileMoneyNumber;

  if (isLoading || profileLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="h-10 w-48 bg-white/5 rounded-lg animate-pulse" />
        <SkeletonCard lines={3} />
        <SkeletonKpiGrid count={4} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  const balanceDue = data?.balanceDue ?? 0;
  const tier = profile?.tier ?? 'NEW';
  const prePublishEvents = (statsData?.events ?? []).filter((e) => PRE_PUBLISH.includes(e.status));

  // IDs des événements déjà couverts par le planning réel
  const coveredEventIds = new Set((scheduleData?.schedules ?? []).map((s) => s.eventId));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-bebas text-4xl tracking-wider text-gradient leading-none"
      >
        MES VERSEMENTS
      </motion.h1>

      {/* ── Section 1b — Tier ── */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 border border-white/5 flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1.5">Niveau de confiance</p>
            <TierBadge tier={profile.tier ?? 'NEW'} />
            <p className="text-xs text-white/30 mt-2">{TIER_PERKS[profile.tier ?? 'NEW']}</p>
          </div>
        </motion.div>
      )}

      {/* ── Section 1 — Mobile Money ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-5 border border-violet-neon/20"
      >
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-violet-neon" />
          <h2 className="text-sm font-semibold text-white">
            Numéro de réception Mobile Money
          </h2>
        </div>

        {/* Warning if no number */}
        {!profile?.mobileMoneyNumber && !editing && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300">
              Ajoutez votre numéro pour recevoir vos versements.
            </p>
          </div>
        )}

        {!showEdit ? (
          /* Display mode */
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-white text-base">{profile?.mobileMoneyNumber}</p>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/20 text-green-400 text-[11px] font-semibold">
                  <Check className="w-3 h-3" />
                  Vérifié
                </span>
              </div>
              <p className="text-xs text-white/30 mt-1">Airtel / Moov Money</p>
            </div>
            <button
              onClick={() => {
                setPhoneInput(profile?.mobileMoneyNumber ?? '');
                setEditing(true);
              }}
              className="text-xs text-violet-neon hover:text-violet-neon/80 underline underline-offset-2 transition-colors"
            >
              Modifier
            </button>
          </div>
        ) : (
          /* Edit mode */
          <div className="space-y-3">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Ex : 077000000 ou 060000000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon/50 transition-colors"
            />
            <p className="text-xs text-white/30">
              Saisir le numéro Airtel ou Moov Money sans indicatif pays ni espace. BilletGo l'utilisera pour vos virements.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePhone}
                disabled={updateProfile.isLoading}
              >
                <Check className="w-3.5 h-3.5" />
                {updateProfile.isLoading ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              {editing && (
                <button
                  onClick={() => { setEditing(false); setPhoneInput(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Annuler
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Section 2 — KPI grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Total collecté"
          value={formatPrice(data?.totalCollected ?? 0, 'FCFA', '0 FCFA')}
          Icon={TrendingUp}
          color="cyan"
        />
        <KpiCard
          label="Commission BilletGo"
          value={formatPrice(data?.totalPlatformFee ?? 0, 'FCFA', '0 FCFA')}
          Icon={TrendingDown}
          color="rose"
        />
        <KpiCard
          label="Montant net"
          value={formatPrice(data?.totalNetAmount ?? 0, 'FCFA', '0 FCFA')}
          Icon={Banknote}
          color="violet"
        />
        <KpiCard
          label="Déjà viré"
          value={formatPrice(data?.totalPaid ?? 0, 'FCFA', '0 FCFA')}
          Icon={CheckCheck}
          color="green"
        />
      </motion.div>

      {/* ── Section 3 — Balance due ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`glass-card p-5 border ${balanceDue > 0 ? 'border-yellow-500/30' : 'border-green-500/20'}`}
      >
        {balanceDue > 0 ? (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-300 mb-1">En attente de versement</p>
              <p className="font-mono font-bold text-2xl text-yellow-400 leading-tight">
                {formatPrice(balanceDue, 'FCFA')}
              </p>
              <p className="text-xs text-white/30 mt-2">
                BilletGo vous contacte directement pour effectuer le virement.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-400 mb-1">Tout est à jour</p>
              <p className="text-xs text-white/30">
                BilletGo vous contacte directement pour effectuer le virement.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Section 3b — Planning de versements (événements publiés) ── */}
      {(scheduleData?.schedules ?? []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="space-y-3"
        >
          <h2 className="font-bebas text-2xl tracking-wider text-white">Planning de versements</h2>
          {/* Grouper par événement */}
          {(() => {
            const byEvent: Record<string, { title: string; date: string; schedules: PayoutScheduleEntry[] }> = {};
            for (const s of scheduleData!.schedules) {
              if (!byEvent[s.eventId]) byEvent[s.eventId] = { title: s.event.title, date: s.event.eventDate, schedules: [] };
              byEvent[s.eventId].schedules.push(s);
            }
            return Object.values(byEvent).map((group) => (
              <div key={group.title} className="glass-card overflow-hidden border border-white/5">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-semibold text-white truncate">{group.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">{new Date(group.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="divide-y divide-white/5">
                  {group.schedules.map((s) => <ScheduleRow key={s.id} s={s} />)}
                </div>
              </div>
            ));
          })()}
        </motion.div>
      )}

      {/* ── Section 3c — Planning prévisionnel (événements non publiés) ── */}
      {prePublishEvents.filter((e) => !coveredEventIds.has(e.eventId)).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          className="space-y-3"
        >
          <div>
            <h2 className="font-bebas text-2xl tracking-wider text-white/60">Planning prévisionnel</h2>
            <p className="text-xs text-white/25 mt-0.5">
              Ces événements ne sont pas encore publiés. Les montants sont des estimations basées sur votre niveau <span className="text-white/40 font-semibold">{TIER_META[tier]?.label ?? tier}</span> et les ventes actuelles.
            </p>
          </div>
          {prePublishEvents
            .filter((e) => !coveredEventIds.has(e.eventId))
            .map((e) => <SimulatedEventBlock key={e.eventId} event={e} tier={tier} />)
          }
        </motion.div>
      )}

      {/* ── Section 4 — History ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="font-bebas text-2xl tracking-wider text-white">
          Historique des virements
        </h2>

        {(data?.payouts ?? []).length === 0 ? (
          <p className="text-white/30 italic text-sm py-4">
            Aucun virement reçu pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {(data?.payouts ?? []).map((payout) => (
              <PayoutRow key={payout.id} payout={payout} />
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Section 5 — Support ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-4 border border-white/5"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">
              Une question sur vos versements ?
            </p>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
            >
              Contacter le support via WhatsApp
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
