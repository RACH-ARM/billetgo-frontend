import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import {
  CalendarDays, Ticket, TrendingUp, Users,
  LogOut, AlertTriangle, Check, Clock, Upload, FileCheck, Phone, X,
  Star, Shield, Award, Zap, UserCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useOrganizerStats, useOrganizerProfile, useUpdateProfile, useOrganizerAnalytics, useUploadKYC } from '../hooks/useOrganizer';
import { type OrganizerEventStat } from '../services/organizerService';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/common/Spinner';
import { SkeletonKpiGrid, SkeletonCard, SkeletonTable } from '../components/common/Skeleton';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({
  title, value, subtitle, Icon, color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: 'violet' | 'rose' | 'cyan' | 'green';
}) {
  const colors = {
    violet: { text: 'text-violet-neon', bg: 'bg-violet-neon/10', border: 'border-violet-neon/20' },
    rose:   { text: 'text-rose-neon',   bg: 'bg-rose-neon/10',   border: 'border-rose-neon/20' },
    cyan:   { text: 'text-cyan-neon',   bg: 'bg-cyan-neon/10',   border: 'border-cyan-neon/20' },
    green:  { text: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20' },
  };
  const c = colors[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 border ${c.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">{title}</p>
          <p className={`font-bebas text-3xl sm:text-4xl ${c.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-white/30 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
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

// ── Mobile Money banner ───────────────────────────────────────
function MobileMoneyBanner() {
  const { data: profile } = useOrganizerProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  if (!profile) return null;

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ mobileMoneyNumber: value });
      toast.success('Numéro enregistré');
      setEditing(false);
    } catch {
      toast.error('Numéro invalide (8 à 15 chiffres)');
    }
  };

  if (profile.mobileMoneyNumber && !editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 mb-6 glass-card border border-green-500/20 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/40 uppercase tracking-widest">Numéro Mobile Money (virements)</p>
          <p className="text-sm text-white font-mono font-semibold">{profile.mobileMoneyNumber}</p>
        </div>
        <button
          onClick={() => { setValue(profile.mobileMoneyNumber!); setEditing(true); }}
          className="text-xs text-white/30 hover:text-white transition-colors flex-shrink-0"
        >
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 mb-6 glass-card border border-rose-neon/30 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-rose-neon/10 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-rose-neon" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-semibold">Numéro Mobile Money manquant</p>
        <p className="text-xs text-white/40">Renseignez votre numéro Airtel ou Moov pour recevoir vos virements.</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="tel"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: 074000000"
            className="w-full sm:w-40 bg-bg-secondary border border-violet-neon/30 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
            autoFocus
          />
          <Button size="sm" variant="primary" onClick={handleSave} isLoading={updateProfile.isLoading}>
            <Check className="w-3.5 h-3.5" />
          </Button>
          <button onClick={() => setEditing(false)} className="text-white/30 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <Button size="sm" variant="primary" onClick={() => setEditing(true)}>
          <Phone className="w-3.5 h-3.5" /> Ajouter
        </Button>
      )}
    </div>
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
      toast.success('Document soumis — l\'équipe BilletGo va l\'examiner');
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
            Votre compte organisateur est en cours de vérification par l'équipe BilletGo.
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
                href={`https://docs.google.com/viewer?url=${encodeURIComponent(kycUrl)}&embedded=true`}
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
            {profile && (() => {
              const tier = profile.tier ?? 'NEW';
              const tierMap: Record<string, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
                NEW:       { label: 'Nouveau',  color: 'text-white/40',    Icon: Star   },
                APPROVED:  { label: 'Approuvé', color: 'text-cyan-neon',   Icon: Shield },
                CERTIFIED: { label: 'Certifié', color: 'text-violet-neon', Icon: Award  },
                PREMIUM:   { label: 'Premium',  color: 'text-yellow-400',  Icon: Zap    },
              };
              const meta = tierMap[tier] ?? tierMap.NEW;
              const { Icon } = meta;
              return (
                <span className={`flex items-center gap-1 text-xs font-semibold ${meta.color}`}>
                  <Icon className="w-3 h-3" /> {meta.label}
                </span>
              );
            })()}
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
            to="/mes-evenements"
            className="neon-button text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5"
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Mes événements</span>
          </Link>
        </div>
      </div>

      <MobileMoneyBanner />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Événements" value={data?.eventsCount ?? 0} subtitle="Total créés" Icon={CalendarDays} color="violet" />
        <KpiCard title="Billets vendus" value={(data?.globalSold ?? 0).toLocaleString('fr-FR')} subtitle="Toutes catégories" Icon={Ticket} color="cyan" />
        <KpiCard title="Revenus nets" value={formatPrice(data?.globalRevenue ?? 0, 'FCFA', '0 FCFA')} subtitle="Après commission BilletGo" Icon={TrendingUp} color="green" />
        <KpiCard title="Acheteurs" value={(data?.globalSold ?? 0).toLocaleString('fr-FR')} subtitle="Billets générés" Icon={Users} color="rose" />
      </div>

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
