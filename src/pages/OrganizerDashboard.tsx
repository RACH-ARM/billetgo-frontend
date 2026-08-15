import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import {
  CalendarDays, Ticket, TrendingUp, TrendingDown,
  LogOut, Check, Clock, Upload, FileCheck,
  UserCircle, Minus, Banknote, Heart, Users, Globe, ShoppingBag, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useOrganizerStats, useOrganizerProfile, useOrganizerAnalytics, useUploadKYC, useOrganizerPayouts } from '../hooks/useOrganizer';
import { type OrganizerEventStat, type CategoryStat, type ChannelCount } from '../services/organizerService';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/common/Spinner';
import { SkeletonKpiGrid, SkeletonCard, SkeletonTable } from '../components/common/Skeleton';
import toast from 'react-hot-toast';

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({
  title, value, subtitle, Icon, color, trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: 'violet' | 'rose' | 'cyan' | 'green';
  trend?: number; // % change vs previous period, undefined = no data
}) {
  const colors = {
    violet: { text: 'text-violet-neon', bg: 'bg-violet-neon/10', border: 'border-violet-neon/20' },
    rose:   { text: 'text-rose-neon',   bg: 'bg-rose-neon/10',   border: 'border-rose-neon/20' },
    cyan:   { text: 'text-cyan-neon',   bg: 'bg-cyan-neon/10',   border: 'border-cyan-neon/20' },
    green:  { text: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20' },
  };
  const c = colors[color];
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend === undefined || trend === 0 ? 'text-white/20' : trend > 0 ? 'text-green-400' : 'text-rose-neon';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 border ${c.border}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">{title}</p>
          <p className={`font-bebas text-3xl sm:text-4xl ${c.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-white/30 mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
          {trend !== undefined && (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              {trend === 0 ? '—' : `${trend > 0 ? '+' : ''}${trend}%`}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Category breakdown section ────────────────────────────────
function CatRow({ cat, eventTitle }: { cat: CategoryStat; eventTitle?: string }) {
  const fillPct = cat.quantityTotal > 0 ? (cat.quantitySold / cat.quantityTotal) * 100 : 0;
  const barColor = fillPct >= 90 ? 'bg-rose-neon' : fillPct >= 60 ? 'bg-yellow-400' : 'bg-cyan-neon';
  const remaining = cat.quantityTotal - cat.quantitySold;
  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-semibold text-white text-sm truncate">{cat.name}</span>
          <span className="text-xs font-mono text-violet-neon bg-violet-neon/10 px-2 py-0.5 rounded-full border border-violet-neon/20 flex-shrink-0">
            {formatPrice(cat.price, 'FCFA', '0')}
          </span>
          {eventTitle && (
            <span className="text-[10px] text-white/30 truncate">{eventTitle}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(fillPct, 100)}%` }} />
          </div>
          <span className="text-[10px] text-white/30 flex-shrink-0">{Math.round(fillPct)}%</span>
        </div>
      </div>
      <div className="flex items-center gap-6 sm:gap-8 flex-shrink-0 text-right">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Vendus</p>
          <p className="font-mono font-bold text-cyan-neon">{cat.quantitySold}<span className="text-white/20 font-normal">/{cat.quantityTotal}</span></p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Restants</p>
          <p className={`font-mono font-bold ${remaining === 0 ? 'text-rose-neon' : 'text-white/60'}`}>{remaining}</p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Revenus</p>
          <p className="font-mono font-bold text-green-400">{formatPrice(cat.revenue, 'FCFA', '0')}</p>
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdown({ events, selectedId }: { events: OrganizerEventStat[]; selectedId: string }) {
  const active = events.filter((e) => ['PUBLISHED', 'APPROVED', 'COMPLETED'].includes(e.status));

  if (!active.length) return null;

  const isAll = selectedId === 'all';
  const selectedEvent = active.find((e) => e.eventId === selectedId);

  const cats: CategoryStat[] = isAll
    ? active.flatMap((e) => e.categoryStats ?? [])
    : (selectedEvent?.categoryStats ?? []);

  const totalSold = cats.reduce((s, c) => s + c.quantitySold, 0);
  const totalRevenue = cats.reduce((s, c) => s + c.revenue, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="glass-card overflow-hidden mb-8 border border-violet-neon/10"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-violet-neon" />
          <h2 className="font-bebas text-xl tracking-wider text-white">Ventes par catégorie</h2>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
        <div className="px-5 py-3 text-center">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-0.5">Catégories</p>
          <p className="font-mono font-bold text-sm text-violet-neon">{cats.length}</p>
        </div>
        <div className="px-5 py-3 text-center">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-0.5">Billets vendus</p>
          <p className="font-mono font-bold text-sm text-cyan-neon">{totalSold.toLocaleString('fr-FR')}</p>
        </div>
        <div className="px-5 py-3 text-center">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-0.5">Revenus nets</p>
          <p className="font-mono font-bold text-sm text-green-400">{formatPrice(totalRevenue, 'FCFA', '0 FCFA')}</p>
        </div>
      </div>

      {/* Tableau catégories */}
      {cats.length === 0 ? (
        <div className="px-5 py-10 text-center text-white/30 text-sm">Aucune catégorie de billet configurée</div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {isAll
            ? active.map((ev) => (ev.categoryStats ?? []).map((cat) => (
                <CatRow key={cat.id} cat={cat} eventTitle={ev.title} />
              )))
            : cats.map((cat) => (
                <CatRow key={cat.id} cat={cat} />
              ))
          }
        </div>
      )}
    </motion.div>
  );
}

// ── Channel breakdown (ONLINE vs POS) ────────────────────────
function ChannelBreakdown({ channelStats }: { channelStats?: { online: ChannelCount; pos: ChannelCount } | null }) {
  if (!channelStats) return null;
  const { online, pos } = channelStats;
  const total = online.count + pos.count;
  if (total === 0) return null;
  const onlinePct = Math.round((online.count / total) * 100);
  const posPct = 100 - onlinePct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="glass-card p-5 mb-8 border border-violet-neon/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-violet-neon" />
        <h2 className="font-bebas text-xl tracking-wider text-white">Ventes par canal</h2>
      </div>

      {/* Barre de répartition */}
      <div className="h-3 rounded-full overflow-hidden flex mb-4">
        <div className="bg-violet-neon transition-all" style={{ width: `${onlinePct}%` }} />
        <div className="bg-[#25D366] transition-all" style={{ width: `${posPct}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* ONLINE */}
        <div className="bg-violet-neon/5 border border-violet-neon/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-violet-neon/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-violet-neon" />
            </div>
            <span className="text-xs font-semibold text-violet-neon uppercase tracking-widest">En ligne</span>
          </div>
          <p className="font-bebas text-3xl text-white mb-0.5">{online.count.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-white/30">commandes · {onlinePct}%</p>
          <p className="text-sm font-semibold text-violet-neon mt-2">{formatPrice(online.revenue, 'FCFA', '0 FCFA')}</p>
        </div>

        {/* POS */}
        <div className="bg-[#25D366]/5 border border-[#25D366]/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#25D366]" />
            </div>
            <span className="text-xs font-semibold text-[#25D366] uppercase tracking-widest">Guichet POS</span>
          </div>
          <p className="font-bebas text-3xl text-white mb-0.5">{pos.count.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-white/30">commandes · {posPct}%</p>
          <p className="text-sm font-semibold text-[#25D366] mt-2">{formatPrice(pos.revenue, 'FCFA', '0 FCFA')}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Analytics section ─────────────────────────────────────────
const PERIODS = [
  { label: '7 jours',  days: 7  },
  { label: '30 jours', days: 30 },
  { label: '90 jours', days: 90 },
];

function AnalyticsSection({ events }: { events: OrganizerEventStat[] }) {
  const [days, setDays] = useState(30);
  const [eventId, setEventId] = useState<string>('');
  const { data, isLoading } = useOrganizerAnalytics(days, eventId || undefined);

  const publishedEvents = events.filter((e) => ['PUBLISHED', 'APPROVED', 'COMPLETED'].includes(e.status));

  type DayPoint = { date: string; label: string; revenue: number; gross: number; tickets: number };
  const dailySales: DayPoint[] = data?.dailySales ?? [];

  const hasData = dailySales.some((d) => d.tickets > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="glass-card overflow-hidden mb-8"
    >
      <div className="px-5 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-neon" />
          <h2 className="font-bebas text-xl tracking-wider text-white">Analytics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtre événement */}
          {publishedEvents.length > 0 && (
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-violet-neon transition-colors"
            >
              <option value="">Tous les événements</option>
              {publishedEvents.map((ev) => (
                <option key={ev.eventId} value={ev.eventId}>{ev.title}</option>
              ))}
            </select>
          )}
          {/* Filtre période */}
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${days === p.days ? 'bg-violet-neon/20 text-violet-neon border border-violet-neon/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI mini */}
      {data && (
        <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
          {[
            { label: 'Revenus nets', value: formatPrice(data.totalRevenue, 'FCFA', '0 FCFA'), color: 'text-cyan-neon' },
            { label: 'Billets vendus', value: data.totalTickets.toLocaleString('fr-FR'), color: 'text-violet-neon' },
            { label: 'Meilleur jour', value: data.bestDay?.tickets > 0 ? `${data.bestDay.label} (${formatPrice(data.bestDay.revenue, 'FCFA', '0 FCFA')})` : '—', color: 'text-green-400' },
          ].map((item) => (
            <div key={item.label} className="px-5 py-3 text-center">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-0.5">{item.label}</p>
              <p className={`font-mono font-bold text-sm ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !hasData ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <TrendingUp className="w-10 h-10 text-violet-neon/20" />
            <p className="text-white/30 text-sm">Aucune vente sur cette période</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Revenus / jour */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Revenus nets par jour (FCFA)</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailySales} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7B2FBE" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7B2FBE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(123,47,190,0.08)" vertical={false} />
                  <XAxis dataKey="label" stroke="#ffffff20" tick={{ fontSize: 10, fill: '#ffffff40' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#ffffff10" tick={{ fontSize: 10, fill: '#ffffff30' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ stroke: 'rgba(123,47,190,0.3)', strokeWidth: 1 }}
                    contentStyle={{ background: '#1A1A35', border: '1px solid rgba(123,47,190,0.3)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                    formatter={(value: number) => [value.toLocaleString('fr-FR') + ' FCFA', 'Revenus nets']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#7B2FBE" strokeWidth={2} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4, fill: '#7B2FBE' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sources de trafic */}
            {data.trafficSources && data.trafficSources.length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Sources de trafic</p>
                <div className="space-y-2.5">
                  {(() => {
                    const maxOrders = Math.max(...data.trafficSources.map((s: { orders: number }) => s.orders), 1);
                    return data.trafficSources.map((s: { source: string; medium: string | null; orders: number; revenue: number }) => (
                      <div key={`${s.source}-${s.medium}`} className="flex items-center gap-3">
                        <div className="w-28 flex-shrink-0">
                          <p className="text-xs text-white/70 font-medium capitalize truncate">{s.source}</p>
                          {s.medium && <p className="text-[10px] text-white/30 truncate">{s.medium}</p>}
                        </div>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-neon to-cyan-neon"
                            style={{ width: `${(s.orders / maxOrders) * 100}%` }}
                          />
                        </div>
                        <div className="w-20 text-right flex-shrink-0">
                          <span className="text-xs font-mono text-white/70">{s.orders} cmd</span>
                        </div>
                        <div className="w-24 text-right flex-shrink-0">
                          <span className="text-xs font-mono text-cyan-neon">{formatPrice(s.revenue)}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Billets / jour */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Billets vendus par jour</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={dailySales} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="#ffffff20" tick={{ fontSize: 10, fill: '#ffffff40' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#ffffff10" tick={{ fontSize: 10, fill: '#ffffff30' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: 'rgba(0,229,255,0.2)', strokeWidth: 1 }}
                    contentStyle={{ background: '#1A1A35', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                    formatter={(value: number) => [value, 'Billets']}
                  />
                  <Area type="monotone" dataKey="tickets" stroke="#00E5FF" strokeWidth={2} fill="url(#gradTickets)" dot={false} activeDot={{ r: 4, fill: '#00E5FF' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Pending approval screen (with KYC upload) ─────────────────
interface OrganizerProfile {
  isApproved: boolean;
  rejectionReason?: string | null;
  kycDocumentUrl?: string | null;
  kycSubmittedAt?: string | null;
  mobileMoneyNumber?: string | null;
  companyName: string;
}

function PendingApprovalScreen({ profile, onLogout }: { profile: OrganizerProfile; onLogout: () => void }) {
  const uploadKYC = useUploadKYC();
  const [kycUrl, setKycUrl] = useState<string | null>(profile.kycDocumentUrl ?? null);

  useEffect(() => {
    if (profile.kycDocumentUrl) setKycUrl(profile.kycDocumentUrl);
  }, [profile.kycDocumentUrl]);

  const handleKycChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadKYC.mutateAsync(file);
      setKycUrl(result.data?.kycDocumentUrl ?? kycUrl);
      toast.success('Document soumis — l\'équipe BilletGab va l\'examiner');
    } catch {
      toast.error('Erreur lors de l\'upload. Format accepté : JPG, PNG, PDF (max 10MB)');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
          <Clock className="w-8 h-8 text-yellow-400" />
        </div>
        <div>
          <h2 className="font-bebas text-4xl tracking-wider text-gradient mb-2">COMPTE EN ATTENTE D'APPROBATION</h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-md mx-auto">
            Votre compte organisateur est en cours de vérification par l'équipe BilletGab.
            Vous recevrez une notification dès que votre compte sera approuvé.
          </p>
        </div>
      </div>

      {profile.rejectionReason && (
        <div className="p-4 glass-card border border-rose-neon/30 rounded-xl">
          <p className="text-xs text-rose-neon uppercase tracking-widest mb-1">Motif du refus</p>
          <p className="text-white/70 text-sm">{profile.rejectionReason}</p>
        </div>
      )}

      {/* KYC document */}
      <div className="glass-card p-6 border border-violet-neon/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-neon/10 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-5 h-5 text-violet-neon" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Document d'identité (KYC)</p>
            <p className="text-white/40 text-xs">CNI, passeport ou RCCM — JPG, PNG ou PDF · Max 10MB</p>
          </div>
        </div>

        {kycUrl ? (
          <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400 text-sm font-semibold">Document soumis</span>
              {profile.kycSubmittedAt && (
                <span className="text-white/30 text-xs hidden sm:inline">
                  — {new Date(profile.kycSubmittedAt).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={/\.(jpg|jpeg|png|webp)$/i.test(kycUrl) || kycUrl.includes('/image/upload/') ? kycUrl : `https://docs.google.com/viewer?url=${encodeURIComponent(kycUrl)}&embedded=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-neon hover:text-violet-neon/70 transition-colors"
              >
                Voir
              </a>
              <label className="cursor-pointer text-xs text-white/40 hover:text-white transition-colors">
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleKycChange} className="hidden" />
                Remplacer
              </label>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-violet-neon/30 rounded-xl cursor-pointer hover:border-violet-neon/60 transition-colors group">
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleKycChange} className="hidden" />
            {uploadKYC.isLoading ? (
              <Spinner size="md" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-violet-neon/10 flex items-center justify-center group-hover:bg-violet-neon/20 transition-colors">
                  <Upload className="w-5 h-5 text-violet-neon" />
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-sm font-semibold">Cliquez pour soumettre votre document</p>
                  <p className="text-white/30 text-xs mt-0.5">Requis pour l'approbation de votre compte</p>
                </div>
              </>
            )}
          </label>
        )}
      </div>

      <button
        onClick={onLogout}
        className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-rose-neon hover:border-rose-neon/30 transition-colors text-sm"
      >
        <LogOut className="w-4 h-4" /> Déconnexion
      </button>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────
export default function OrganizerDashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { data, isLoading } = useOrganizerStats();
  const { data: profile, isLoading: profileLoading } = useOrganizerProfile();
  const { data: analytics60 } = useOrganizerAnalytics(60);
  const { data: payoutsData } = useOrganizerPayouts();

  // Filtre événement partagé entre ChannelBreakdown et CategoryBreakdown
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Initialiser sur l'événement le plus récent dès que les données arrivent
  useEffect(() => {
    if (!data?.events?.length || selectedEventId) return;
    const active = data.events
      .filter((e) => ['PUBLISHED', 'APPROVED', 'COMPLETED'].includes(e.status))
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    setSelectedEventId(active[0]?.eventId ?? 'all');
  }, [data?.events, selectedEventId]);

  // Calcul de tendance : 30 derniers jours vs 30 jours précédents
  const computeTrend = (key: 'tickets' | 'revenue'): number | undefined => {
    const days = analytics60?.dailySales as Array<{ tickets: number; revenue: number }> | undefined;
    if (!days || days.length < 2) return undefined;
    const mid = Math.floor(days.length / 2);
    const prev = days.slice(0, mid).reduce((s, d) => s + d[key], 0);
    const curr = days.slice(mid).reduce((s, d) => s + d[key], 0);
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };
  const trendTickets = computeTrend('tickets');
  const trendRevenue = computeTrend('revenue');

  if (isLoading || profileLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <SkeletonKpiGrid count={4} />
        <SkeletonKpiGrid count={3} />
        <SkeletonCard lines={5} />
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (profile && !profile.isApproved) {
    return <PendingApprovalScreen profile={profile} onLogout={async () => { await logout(); navigate('/login'); }} />;
  }

  const chartData = (data?.events ?? []).map((e) => ({
    name: e.title.length > 16 ? e.title.slice(0, 16) + '…' : e.title,
    vendus: e.totalSold,
    revenus: e.totalRevenue,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bebas text-4xl tracking-wider text-gradient leading-none">TABLEAU DE BORD</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-white/40 text-xs">Vue d'ensemble de vos événements et ventes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/compte"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all"
          >
            <UserCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Mon compte</span>
          </Link>
          <Link
            to="/versements"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all text-cyan-neon border-cyan-neon/30 hover:bg-cyan-neon/10"
          >
            <Banknote className="w-4 h-4" />
            <span className="hidden sm:inline">Versements</span>
          </Link>
          <Link
            to="/mes-evenements"
            className="neon-button text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5"
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Mes événements</span>
          </Link>
        </div>
      </div>

      {/* KPIs — ventes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard title="Événements" value={data?.eventsCount ?? 0} subtitle="Total créés" Icon={CalendarDays} color="violet" />
        <KpiCard title="Billets vendus" value={(data?.globalSold ?? 0).toLocaleString('fr-FR')} subtitle="vs 30j précédents" Icon={Ticket} color="cyan" trend={trendTickets} />
        <KpiCard title="Revenus nets" value={formatPrice(data?.globalRevenue ?? 0, 'FCFA', '0 FCFA')} subtitle="vs 30j précédents" Icon={TrendingUp} color="green" trend={trendRevenue} />
        <Link to="/versements" className="block group">
          <KpiCard
            title="Solde à verser"
            value={formatPrice(payoutsData?.balanceDue ?? 0, 'FCFA', '0 FCFA')}
            subtitle="Voir mes versements"
            Icon={Banknote}
            color="rose"
          />
        </Link>
      </div>

      {/* KPIs — engagement */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <KpiCard
          title="Abonnés"
          value={(data?.totalFollowers ?? 0).toLocaleString('fr-FR')}
          subtitle="Followers de votre page"
          Icon={Users}
          color="violet"
        />
        <KpiCard
          title="Total likes"
          value={(data?.totalLikes ?? 0).toLocaleString('fr-FR')}
          subtitle="Likes sur vos événements"
          Icon={Heart}
          color="rose"
        />
      </div>

      {/* Filtre événement global */}
      {(data?.events?.filter((e) => ['PUBLISHED', 'APPROVED', 'COMPLETED'].includes(e.status)).length ?? 0) > 1 && (
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs text-white/40 uppercase tracking-wider whitespace-nowrap">Événement</span>
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-bg-card border border-violet-neon/20 rounded-xl px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:border-violet-neon transition-colors appearance-none"
            >
              <option value="all">Tous les événements</option>
              {data?.events
                .filter((e) => ['PUBLISHED', 'APPROVED', 'COMPLETED'].includes(e.status))
                .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                .map((ev) => (
                  <option key={ev.eventId} value={ev.eventId}>{ev.title}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Ventes par canal (ONLINE vs POS) */}
      {(() => {
        const activeEvents = data?.events?.filter((e) => ['PUBLISHED', 'APPROVED', 'COMPLETED'].includes(e.status)) ?? [];
        const channelStats = selectedEventId === 'all' || !selectedEventId
          ? data?.channelStats
          : activeEvents.find((e) => e.eventId === selectedEventId)?.channelStats ?? null;
        return <ChannelBreakdown channelStats={channelStats} />;
      })()}

      {/* Ventes par catégorie */}
      <CategoryBreakdown events={data?.events ?? []} selectedId={selectedEventId || 'all'} />

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-8"
        >
          <h2 className="font-bebas text-xl tracking-wider text-white mb-6">Ventes par événement</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(123,47,190,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff30" tick={{ fontSize: 11, fill: '#ffffff60' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#ffffff20" tick={{ fontSize: 11, fill: '#ffffff40' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(123,47,190,0.08)' }}
                contentStyle={{ background: '#1A1A35', border: '1px solid rgba(123,47,190,0.3)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#fff', fontWeight: 600 }}
                itemStyle={{ color: '#ffffff80' }}
              />
              <Bar dataKey="vendus" fill="#7B2FBE" radius={[6, 6, 0, 0]} name="Billets vendus" />
              <Bar dataKey="revenus" fill="#00E5FF" radius={[6, 6, 0, 0]} name="Revenus (FCFA)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Analytics */}
      <AnalyticsSection events={data?.events ?? []} />
    </div>
  );
}
