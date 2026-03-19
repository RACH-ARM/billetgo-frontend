import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Legend,
} from 'recharts';
import {
  CalendarDays, Ticket, TrendingUp, Users, Download, Search,
  ChevronRight, ArrowLeft, Phone, Mail, CreditCard,
  Plus, X, LogOut, Trash2, Flame, Star, AlertTriangle, Check,
  Banknote, MessageCircle, Pencil, Clock, Ban, Copy, Tag, Upload, FileCheck,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useOrganizerStats, useEventBuyers, useCreateEvent, useOrganizerProfile, useUpdateProfile, useOrganizerPayouts, useEventDetails, useUpdateEvent, useResubmitEvent, useCancelEvent, useCloneEvent, useEventPromos, useCreatePromoCode, useDeletePromoCode, useUploadKYC, useOrganizerAnalytics, useEventWaitlist, usePlatformRates, type PlatformRates } from '../hooks/useOrganizer';
import { organizerService, type OrganizerEventStat, type CreateEventTicketCategory } from '../services/organizerService';
import { formatPrice } from '../utils/formatPrice';
import { formatEventDate } from '../utils/formatDate';
import Spinner from '../components/common/Spinner';
import { SkeletonKpiGrid, SkeletonCard, SkeletonTable } from '../components/common/Skeleton';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

// ── Status badge ──────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:          { label: 'Brouillon',     className: 'bg-white/10 text-white/50' },
  PENDING_REVIEW: { label: 'En révision',   className: 'bg-yellow-500/20 text-yellow-400' },
  NEEDS_REVISION: { label: 'Révision requise', className: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' },
  APPROVED:       { label: 'Approuvé',      className: 'bg-green-500/20 text-green-400' },
  PUBLISHED:      { label: 'Publié',        className: 'bg-violet-neon/20 text-violet-neon' },
  REJECTED:       { label: 'Refusé',        className: 'bg-rose-neon/20 text-rose-neon' },
  CANCELLED:      { label: 'Annulé',        className: 'bg-rose-neon/20 text-rose-neon' },
  COMPLETED:      { label: 'Terminé',       className: 'bg-cyan-neon/20 text-cyan-neon' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-white/10 text-white/50' };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

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

// ── Buyers panel ──────────────────────────────────────────────
function BuyersPanel({ event, onBack }: { event: OrganizerEventStat; onBack: () => void }) {
  const { data: buyers, isLoading } = useEventBuyers(event.eventId);
  const [search, setSearch] = useState('');

  const filtered = (buyers ?? []).filter((b) =>
    b.buyerName.toLowerCase().includes(search.toLowerCase()) ||
    b.buyerPhone.includes(search) ||
    (b.buyerEmail ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bebas text-2xl tracking-wider text-white truncate">{event.title}</h2>
          <p className="text-white/40 text-xs">{event.totalSold} acheteurs · {formatEventDate(event.eventDate)}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => organizerService.exportCSV(event.eventId)}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou téléphone..."
          className="w-full bg-bg-card border border-violet-neon/20 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-neon transition-colors text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          {search ? 'Aucun résultat' : 'Aucun acheteur pour cet événement'}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                  <th className="text-left px-5 py-3">Acheteur</th>
                  <th className="text-left px-5 py-3">Contact</th>
                  <th className="text-left px-5 py-3">Billets</th>
                  <th className="text-right px-5 py-3">Montant</th>
                  <th className="text-left px-5 py-3">Paiement</th>
                  <th className="text-left px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 text-white font-semibold">{order.buyerName}</td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 text-white/60 text-xs">
                          <Phone className="w-3 h-3 flex-shrink-0" />{order.buyerPhone}
                        </p>
                        {order.buyerEmail && (
                          <p className="flex items-center gap-1.5 text-white/60 text-xs">
                            <Mail className="w-3 h-3 flex-shrink-0" />{order.buyerEmail}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        {order.orderItems.map((item, i) => (
                          <p key={i} className="text-white/70 text-xs">
                            {item.category.name} ×{item.quantity}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-cyan-neon font-bold">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      {order.payments[0] && (
                        <span className={`flex items-center gap-1 text-xs font-semibold ${
                          order.payments[0].provider === 'AIRTEL_MONEY' ? 'text-rose-neon' : 'text-cyan-neon'
                        }`}>
                          <CreditCard className="w-3 h-3" />
                          {order.payments[0].provider === 'AIRTEL_MONEY' ? 'Airtel' : 'Moov'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-white/40 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-white/5 text-xs text-white/30">
            {filtered.length} acheteur{filtered.length > 1 ? 's' : ''}
            {search && ` · filtré sur "${search}"`}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Waitlist panel ─────────────────────────────────────────────
function WaitlistPanel({ event, onBack }: { event: OrganizerEventStat; onBack: () => void }) {
  const { data, isLoading } = useEventWaitlist(event.eventId);
  const [search, setSearch] = useState('');

  const entries = data?.waitlist ?? [];
  const filtered = entries.filter((w) =>
    w.email.toLowerCase().includes(search.toLowerCase()) ||
    (w.phone ?? '').includes(search)
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bebas text-2xl tracking-wider text-white truncate">{event.title}</h2>
          <p className="text-white/40 text-xs">{data?.total ?? 0} personne{(data?.total ?? 0) > 1 ? 's' : ''} en attente</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => organizerService.exportWaitlistCSV(event.eventId)}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par email ou téléphone..."
          className="w-full bg-bg-card border border-violet-neon/20 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-neon transition-colors text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          {search ? 'Aucun résultat' : 'Aucune personne en liste d\'attente'}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Téléphone</th>
                  <th className="text-left px-5 py-3">Notifié</th>
                  <th className="text-left px-5 py-3">Date inscription</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 text-white">{w.email}</td>
                    <td className="px-5 py-4 text-white/60 text-xs">{w.phone ?? '—'}</td>
                    <td className="px-5 py-4">
                      {w.notified ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                          <Check className="w-3 h-3" /> Oui
                        </span>
                      ) : (
                        <span className="text-xs text-white/30">Non</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-white/40 text-xs">
                      {new Date(w.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-white/5 text-xs text-white/30">
            {filtered.length} entrée{filtered.length > 1 ? 's' : ''}
            {search && ` · filtré sur "${search}"`}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Create Event Form ──────────────────────────────────────────
const EVENT_CATEGORIES = [
  { value: 'CLUB', label: 'Club / Soirée' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'BEACH', label: 'Beach Party' },
  { value: 'CONCERT', label: 'Concert' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'CULTUREL', label: 'Culturel' },
  { value: 'AUTRE', label: 'Autre' },
];

function buildOffers(rates: PlatformRates) {
  const fmt = (rate: number) => `${(rate * 100 % 1 === 0 ? rate * 100 : (rate * 100).toFixed(1))}%`;
  const ex = (rate: number) => {
    const net = Math.round(5000 * (1 - rate));
    return `${net.toLocaleString('fr-FR')} FCFA reversés / billet à 5 000 FCFA`;
  };
  return [
    {
      value: 'STANDARD',
      label: 'Standard',
      commission: fmt(rates.standardCommission),
      tagline: 'L\'essentiel pour démarrer',
      perks: [
        'Page événement + affiche HD',
        'Vente Mobile Money 24h/24',
        'QR Code unique + PDF en 30s',
        'Dashboard ventes en temps réel',
        'Export CSV acheteurs',
        'App de scan illimitée Jour J',
      ],
      example: ex(rates.standardCommission),
      color: 'border-white/15 hover:border-violet-neon/40',
      activeColor: 'border-violet-neon bg-violet-neon/10',
      badge: null as ReactNode,
    },
    {
      value: 'INTERMEDIAIRE',
      label: 'Intermédiaire',
      commission: fmt(rates.intermediateCommission),
      tagline: 'Visibilité + Promotion DISICK',
      perks: [
        'Tout Standard inclus',
        'Badge HOT + section Tendances',
        'WhatsApp Broadcast DISICK',
        'Story Instagram + TikTok DISICK',
        'Rapport analytique post-événement',
        'Support prioritaire WhatsApp',
      ],
      example: ex(rates.intermediateCommission),
      color: 'border-white/15 hover:border-rose-neon/40',
      activeColor: 'border-rose-neon bg-rose-neon/10',
      badge: <span className="flex items-center gap-1 text-rose-neon font-bold text-xs"><Flame className="w-3 h-3" /> HOT</span> as ReactNode,
    },
    {
      value: 'PREMIUM',
      label: 'Premium',
      commission: fmt(rates.premiumCommission),
      tagline: 'Visibilité max + Terrain',
      perks: [
        'Tout Intermédiaire inclus',
        'Section "À LA UNE" exclusive',
        'Affichage physique Libreville',
        'Posts influenceurs gabonais',
        'Couverture médias locaux',
        'Support VIP 7j/7',
      ],
      example: ex(rates.premiumCommission),
      color: 'border-white/15 hover:border-yellow-400/40',
      activeColor: 'border-yellow-400 bg-yellow-400/10',
      badge: <span className="flex items-center gap-1 text-yellow-400 font-bold text-xs"><Star className="w-3 h-3" /> À la une</span> as ReactNode,
    },
  ];
}

const EMPTY_CATEGORY: CreateEventTicketCategory = { name: '', price: 0, quantityTotal: 0, maxPerOrder: 10 };

const inputCls = 'w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors';
const labelCls = 'text-xs text-white/40 uppercase tracking-widest block mb-1.5';

function CreateEventForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const createEvent = useCreateEvent();
  const { data: rates } = usePlatformRates();
  const OFFERS = buildOffers(rates ?? { standardCommission: 0.10, intermediateCommission: 0.15, premiumCommission: 0.20, freeTicketFee: 500 });
  const [contractAccepted, setContractAccepted] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '', category: 'AUTRE',
    offer: 'STANDARD',
    eventDate: '', doorsOpenAt: '', endDate: '', scheduledPublishAt: '',
    venueName: '', venueAddress: '', venueCity: 'Libreville',
    maxTicketsPerOrder: 10,
  });
  const [categories, setCategories] = useState<CreateEventTicketCategory[]>([{ ...EMPTY_CATEGORY }]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const setField = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setCategoryField = (i: number, field: keyof CreateEventTicketCategory, value: string | number) =>
    setCategories((cats) => cats.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const addCategory = () => setCategories((cats) => [...cats, { ...EMPTY_CATEGORY }]);
  const removeCategory = (i: number) => setCategories((cats) => cats.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.eventDate || !form.venueName || !form.venueAddress) {
      toast.error('Remplissez tous les champs obligatoires');
      return;
    }
    if (categories.some((c) => !c.name || c.price < 0 || c.quantityTotal <= 0)) {
      toast.error('Vérifiez les catégories de billets');
      return;
    }
    try {
      await createEvent.mutateAsync({
        payload: {
          ...form,
          doorsOpenAt: form.doorsOpenAt || undefined,
          endDate: form.endDate || undefined,
          scheduledPublishAt: form.scheduledPublishAt || undefined,
          ticketCategories: categories,
          contractAcceptedAt: new Date().toISOString(),
        },
        coverImage: coverImage ?? undefined,
      });
      toast.success('Événement soumis — en attente de validation admin');
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erreur lors de la création');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onClose} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h2 className="font-bebas text-3xl tracking-wider text-gradient">NOUVEL ÉVÉNEMENT</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Affiche / Cover */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Affiche de l'événement</h3>
          <label className="block cursor-pointer group">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} className="hidden" />
            {coverPreview ? (
              <div className="relative">
                <img src={coverPreview} alt="Aperçu" className="w-full max-h-64 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">Changer l'image</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-violet-neon/30 rounded-xl p-12 flex flex-col items-center gap-3 group-hover:border-violet-neon/60 transition-colors">
                <div className="w-14 h-14 rounded-full bg-violet-neon/10 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-violet-neon/60" />
                </div>
                <p className="text-white/50 text-sm text-center">Cliquez pour ajouter l'affiche<br /><span className="text-white/25 text-xs">JPG, PNG ou WebP · Max 10MB</span></p>
              </div>
            )}
          </label>
        </div>

        {/* Infos générales */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Informations générales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Titre <span className="text-rose-neon">*</span></label>
              <input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Ex: DISICK Man Show Vol.3" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Sous-titre</label>
              <input value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} placeholder="Ex: La nuit la plus chaude de Libreville" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description <span className="text-rose-neon">*</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Décrivez votre événement..."
                rows={4}
                className={inputCls + ' resize-none'}
              />
            </div>
            <div>
              <label className={labelCls}>Catégorie</label>
              <select value={form.category} onChange={(e) => setField('category', e.target.value)} className={inputCls}>
                {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Max billets / commande</label>
              <input type="number" min={1} max={50} value={form.maxTicketsPerOrder} onChange={(e) => setField('maxTicketsPerOrder', Number(e.target.value))} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Offre */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Offre BilletGo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {OFFERS.map((o) => {
              const isActive = form.offer === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setField('offer', o.value)}
                  className={`relative flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all ${isActive ? o.activeColor : o.color}`}
                >
                  {o.badge && (
                    <span className="absolute top-2.5 right-2.5">{o.badge}</span>
                  )}
                  <span className="font-bebas text-xl tracking-wider text-white">{o.label}</span>
                  <span className="text-xs text-white/40 -mt-1">{o.tagline}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-mono text-2xl font-bold text-white">{o.commission}</span>
                    <span className="text-xs text-white/40">commission</span>
                  </div>
                  <ul className="mt-1 space-y-1.5">
                    {o.perks.map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-xs text-white/60">
                        <span className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0 mt-1.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-white/30 border-t border-white/5 pt-2">{o.example}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dates */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Dates & horaires</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date & heure de début <span className="text-rose-neon">*</span></label>
              <input type="datetime-local" value={form.eventDate} onChange={(e) => setField('eventDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ouverture des portes</label>
              <input type="datetime-local" value={form.doorsOpenAt} onChange={(e) => setField('doorsOpenAt', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date & heure de fin</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Publication programmée <span className="text-white/30 font-normal">(optionnel)</span></label>
              <input type="datetime-local" value={form.scheduledPublishAt} onChange={(e) => setField('scheduledPublishAt', e.target.value)} className={inputCls} />
              <p className="text-xs text-white/30 mt-1">L'événement sera mis en ligne à cette date/heure après approbation admin. Laissez vide pour une publication immédiate.</p>
            </div>
          </div>
        </div>

        {/* Lieu */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Lieu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom du lieu <span className="text-rose-neon">*</span></label>
              <input value={form.venueName} onChange={(e) => setField('venueName', e.target.value)} placeholder="Ex: Club Empire" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input value={form.venueCity} onChange={(e) => setField('venueCity', e.target.value)} placeholder="Libreville" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Adresse <span className="text-rose-neon">*</span></label>
              <input value={form.venueAddress} onChange={(e) => setField('venueAddress', e.target.value)} placeholder="Ex: Boulevard Triomphal, Libreville" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Catégories de billets */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bebas text-lg tracking-wider text-white">Catégories de billets</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addCategory}>
              <Plus className="w-4 h-4" /> Ajouter
            </Button>
          </div>
          {categories.map((cat, i) => (
            <div key={i} className="bg-bg-secondary rounded-xl p-4 border border-violet-neon/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-violet-neon font-semibold uppercase tracking-widest">Catégorie {i + 1}</span>
                {categories.length > 1 && (
                  <button type="button" onClick={() => removeCategory(i)} className="text-white/20 hover:text-rose-neon transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Nom <span className="text-rose-neon">*</span></label>
                  <input value={cat.name} onChange={(e) => setCategoryField(i, 'name', e.target.value)} placeholder="Ex: Standard, VIP, Carré Or" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Prix (FCFA) <span className="text-rose-neon">*</span></label>
                  <input type="number" min={0} value={cat.price} onChange={(e) => setCategoryField(i, 'price', Number(e.target.value))} placeholder="5000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Quantité <span className="text-rose-neon">*</span></label>
                  <input type="number" min={1} value={cat.quantityTotal} onChange={(e) => setCategoryField(i, 'quantityTotal', Number(e.target.value))} placeholder="100" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <input value={cat.description ?? ''} onChange={(e) => setCategoryField(i, 'description', e.target.value)} placeholder="Ex: Accès dancefloor" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Max / commande</label>
                  <input type="number" min={1} max={50} value={cat.maxPerOrder ?? 10} onChange={(e) => setCategoryField(i, 'maxPerOrder', Number(e.target.value))} className={inputCls} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={contractAccepted}
            onChange={(e) => setContractAccepted(e.target.checked)}
            className="mt-0.5 accent-violet-500 w-4 h-4 flex-shrink-0"
          />
          <span className="text-xs text-white/50 leading-relaxed">
            J'accepte les conditions de la plateforme BilletGo, notamment la commission de{' '}
            <span className="text-white font-semibold">
              {OFFERS.find((o) => o.value === form.offer)?.commission ?? '10%'}
            </span>{' '}
            prélevée sur chaque billet vendu (forfait {OFFERS.find((o) => o.value === form.offer)?.label ?? 'Standard'}).
            Je certifie être habilité à soumettre cet événement.
          </span>
        </label>

        <div className="flex gap-3 pb-8">
          <Button type="button" variant="secondary" size="lg" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!contractAccepted}
            isLoading={createEvent.isLoading}
            className="flex-1"
          >
            <CalendarDays className="w-4 h-4" />
            Soumettre l'événement
          </Button>
        </div>
      </form>
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
            { label: 'Revenus nets', value: formatPrice(data.totalRevenue), color: 'text-cyan-neon' },
            { label: 'Billets vendus', value: data.totalTickets.toLocaleString('fr-FR'), color: 'text-violet-neon' },
            { label: 'Meilleur jour', value: data.bestDay?.tickets > 0 ? `${data.bestDay.label} (${formatPrice(data.bestDay.revenue)})` : '—', color: 'text-green-400' },
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

// ── Payouts section ───────────────────────────────────────────
const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP || '24177000000';

function PayoutsSection() {
  const { data, isLoading } = useOrganizerPayouts();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="glass-card overflow-hidden mb-8"
    >
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-green-400" />
          <h2 className="font-bebas text-xl tracking-wider text-white">Mes versements</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3">
          <SkeletonKpiGrid count={4} />
          <SkeletonCard lines={3} />
        </div>
      ) : !data ? null : (
        <div className="p-5 space-y-6">
          {/* Solde résumé */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total collecté', value: formatPrice(data.totalCollected), color: 'text-white' },
              { label: 'Commission BilletGo', value: `- ${formatPrice(data.totalPlatformFee)}`, color: 'text-rose-neon' },
              { label: 'Montant net', value: formatPrice(data.totalNetAmount), color: 'text-cyan-neon' },
              { label: 'Déjà viré', value: formatPrice(data.totalPaid), color: 'text-green-400' },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.04] rounded-xl p-3 border border-white/5">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{item.label}</p>
                <p className={`font-mono font-bold text-sm ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Solde restant à verser */}
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${data.balanceDue > 0 ? 'border-yellow-400/30 bg-yellow-400/5' : 'border-green-500/20 bg-green-500/5'}`}>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest">Solde en attente de versement</p>
              <p className={`font-mono font-bold text-lg mt-0.5 ${data.balanceDue > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {formatPrice(data.balanceDue)}
              </p>
            </div>
            {data.balanceDue > 0 && (
              <p className="text-xs text-white/30 text-right max-w-[180px] leading-relaxed hidden sm:block">
                BilletGo vous contacte directement pour le versement
              </p>
            )}
          </div>

          {/* Historique */}
          {data.payouts.length > 0 ? (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Historique des virements reçus</p>
              <div className="space-y-2">
                {data.payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-white/[0.03] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-bold text-green-400">{formatPrice(p.amountSent)}</p>
                        <p className="text-xs text-white/30">
                          {p.operator} · {p.mobileMoney}
                          {p.transactionRef && <span className="ml-2 font-mono">#{p.transactionRef}</span>}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-white/30 hidden sm:block">
                      {new Date(p.processedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/30 italic">Aucun virement reçu pour le moment.</p>
          )}

          {/* Contact support */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-xs text-white/50 leading-relaxed">
              Pour toute question sur vos versements, contactez BilletGo directement.{' '}
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors font-semibold"
              >
                Écrire sur WhatsApp
              </a>
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Promo codes panel ─────────────────────────────────────────
interface PromoCode {
  id: string;
  code: string;
  discountType: string;
  discountValue: string | number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  stats: { completedOrders: number; totalRevenue: number; totalDiscount: number };
}

function PromoPanel({ event, onBack }: { event: OrganizerEventStat; onBack: () => void }) {
  const { data: promos, isLoading } = useEventPromos(event.eventId);
  const createPromo = useCreatePromoCode(event.eventId);
  const deletePromo = useDeletePromoCode(event.eventId);
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENT',
    discountValue: '',
    maxUses: '',
    expiresAt: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) {
      toast.error('Code et valeur requis');
      return;
    }
    try {
      await createPromo.mutateAsync({
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      toast.success('Code promo créé');
      setForm({ code: '', discountType: 'PERCENT', discountValue: '', maxUses: '', expiresAt: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erreur lors de la création');
    }
  };

  const handleDelete = async (promoId: string) => {
    try {
      await deletePromo.mutateAsync(promoId);
      toast.success('Code désactivé');
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bebas text-2xl tracking-wider text-white truncate">{event.title}</h2>
          <p className="text-white/40 text-xs">Codes promo · {formatEventDate(event.eventDate)}</p>
        </div>
      </div>

      {/* Create form */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3 mb-4">Nouveau code promo</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Code <span className="text-rose-neon">*</span></label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="Ex: VIPNIGHT"
                className={inputCls + ' font-mono tracking-widest uppercase'}
              />
            </div>
            <div>
              <label className={labelCls}>Type de réduction</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                className={inputCls}
              >
                <option value="PERCENT">Pourcentage (%)</option>
                <option value="FIXED">Montant fixe (FCFA)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Valeur <span className="text-rose-neon">*</span></label>
              <input
                type="number"
                min={0}
                max={form.discountType === 'PERCENT' ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'PERCENT' ? '20' : '1000'}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Utilisations max (vide = illimité)</label>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="Ex: 50"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Date d'expiration (vide = aucune)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <Button type="submit" variant="primary" size="md" isLoading={createPromo.isLoading}>
            <Plus className="w-4 h-4" /> Créer le code
          </Button>
        </form>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !promos || (promos as PromoCode[]).length === 0 ? (
        <div className="text-center py-12 text-white/30 glass-card">Aucun code promo créé</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Réduction</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Utilisations</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">CA généré</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Remises</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Expiration</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {(promos as PromoCode[]).map((promo) => (
                  <tr key={promo.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-violet-neon tracking-widest text-sm">
                      {promo.code}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-cyan-neon">
                      {promo.discountType === 'PERCENT'
                        ? `-${promo.discountValue}%`
                        : `-${formatPrice(Number(promo.discountValue))}`}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">
                          {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ''}
                        </span>
                        {promo.maxUses && promo.maxUses > 0 && (
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet-neon"
                              style={{ width: `${Math.min((promo.usedCount / promo.maxUses) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="font-mono text-cyan-neon text-xs">
                        {promo.stats?.completedOrders > 0 ? formatPrice(promo.stats.totalRevenue) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="font-mono text-rose-neon/70 text-xs">
                        {promo.stats?.totalDiscount > 0 ? `- ${formatPrice(promo.stats.totalDiscount)}` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white/40 text-xs hidden md:table-cell">
                      {promo.expiresAt
                        ? new Date(promo.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${promo.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/30'}`}>
                        {promo.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {promo.isActive && (
                        <button
                          onClick={() => handleDelete(promo.id)}
                          disabled={deletePromo.isLoading}
                          className="text-white/20 hover:text-rose-neon transition-colors"
                          title="Désactiver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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

// ── Edit Event Form ────────────────────────────────────────────
function EditEventForm({ eventId, adminNote, onClose, onSuccess }: {
  eventId: string;
  adminNote: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: eventData, isLoading: loadingEvent } = useEventDetails(eventId);
  const updateEvent = useUpdateEvent();
  const resubmitEvent = useResubmitEvent();
  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '', category: 'AUTRE',
    eventDate: '', doorsOpenAt: '', endDate: '', scheduledPublishAt: '',
    venueName: '', venueAddress: '', venueCity: 'Libreville',
    maxTicketsPerOrder: 10,
  });
  const [categories, setCategories] = useState<CreateEventTicketCategory[]>([{ ...EMPTY_CATEGORY }]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (eventData && !initialized) {
      const ed = eventData as Record<string, unknown>;
      setForm({
        title: (ed.title as string) ?? '',
        subtitle: (ed.subtitle as string) ?? '',
        description: (ed.description as string) ?? '',
        category: (ed.category as string) ?? 'AUTRE',
        eventDate: ((ed.eventDate as string) ?? '').slice(0, 16),
        doorsOpenAt: ((ed.doorsOpenAt as string) ?? '').slice(0, 16),
        endDate: ((ed.endDate as string) ?? '').slice(0, 16),
        scheduledPublishAt: ((ed.scheduledPublishAt as string) ?? '').slice(0, 16),
        venueName: (ed.venueName as string) ?? '',
        venueAddress: (ed.venueAddress as string) ?? '',
        venueCity: (ed.venueCity as string) ?? 'Libreville',
        maxTicketsPerOrder: (ed.maxTicketsPerOrder as number) ?? 10,
      });
      const cats = ed.ticketCategories as Array<{ name: string; price: number; quantityTotal: number; maxPerOrder?: number }>;
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats.map((c) => ({ name: c.name, price: c.price, quantityTotal: c.quantityTotal, maxPerOrder: c.maxPerOrder ?? 10 })));
      }
      if (ed.coverImageUrl) setCoverPreview(ed.coverImageUrl as string);
      setInitialized(true);
    }
  }, [eventData, initialized]);

  const setField = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }));
  const setCategoryField = (i: number, field: keyof CreateEventTicketCategory, value: string | number) =>
    setCategories((cats) => cats.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  const addCategory = () => setCategories((cats) => [...cats, { ...EMPTY_CATEGORY }]);
  const removeCategory = (i: number) => setCategories((cats) => cats.filter((_, idx) => idx !== i));

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.eventDate || !form.venueName || !form.venueAddress) {
      toast.error('Remplissez tous les champs obligatoires');
      return;
    }
    if (categories.some((c) => !c.name || c.price < 0 || c.quantityTotal <= 0)) {
      toast.error('Vérifiez les catégories de billets');
      return;
    }
    try {
      await updateEvent.mutateAsync({
        eventId,
        payload: {
          ...form,
          doorsOpenAt: form.doorsOpenAt || undefined,
          endDate: form.endDate || undefined,
          scheduledPublishAt: form.scheduledPublishAt || undefined,
          ticketCategories: categories,
        },
        coverImage: coverImage ?? undefined,
      });
      await resubmitEvent.mutateAsync(eventId);
      toast.success('Événement mis à jour et republié pour validation');
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erreur lors de la mise à jour');
    }
  };

  const isSubmitting = updateEvent.isLoading || resubmitEvent.isLoading;

  if (loadingEvent || !initialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-neon/30 border-t-violet-neon rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onClose} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h2 className="font-bebas text-3xl tracking-wider text-gradient">MODIFIER L'ÉVÉNEMENT</h2>
      </div>

      {adminNote && (
        <div className="mb-6 p-4 glass-card border border-yellow-400/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-yellow-400/70 uppercase tracking-widest mb-1">Demande de l'administrateur</p>
            <p className="text-white/70 text-sm leading-relaxed">{adminNote}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Affiche de l'événement</h3>
          <label className="block cursor-pointer group">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} className="hidden" />
            {coverPreview ? (
              <div className="relative">
                <img src={coverPreview} alt="Aperçu" className="w-full max-h-64 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">Changer l'image</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-violet-neon/30 rounded-xl p-12 flex flex-col items-center gap-3 group-hover:border-violet-neon/60 transition-colors">
                <CalendarDays className="w-6 h-6 text-violet-neon/60" />
                <p className="text-white/50 text-sm text-center">Cliquez pour changer l'affiche</p>
              </div>
            )}
          </label>
        </div>

        {/* Infos générales */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Informations générales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Titre <span className="text-rose-neon">*</span></label>
              <input value={form.title} onChange={(e) => setField('title', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Sous-titre</label>
              <input value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description <span className="text-rose-neon">*</span></label>
              <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={4} className={inputCls + ' resize-none'} />
            </div>
            <div>
              <label className={labelCls}>Catégorie</label>
              <select value={form.category} onChange={(e) => setField('category', e.target.value)} className={inputCls}>
                {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Max billets / commande</label>
              <input type="number" min={1} max={50} value={form.maxTicketsPerOrder} onChange={(e) => setField('maxTicketsPerOrder', Number(e.target.value))} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Dates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date & heure <span className="text-rose-neon">*</span></label>
              <input type="datetime-local" value={form.eventDate} onChange={(e) => setField('eventDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ouverture des portes</label>
              <input type="datetime-local" value={form.doorsOpenAt} onChange={(e) => setField('doorsOpenAt', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fin de l'événement</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Publication programmée <span className="text-white/30 font-normal">(optionnel)</span></label>
              <input type="datetime-local" value={form.scheduledPublishAt} onChange={(e) => setField('scheduledPublishAt', e.target.value)} className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Laissez vide pour une publication immédiate après approbation.</p>
            </div>
          </div>
        </div>

        {/* Lieu */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Lieu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom du lieu <span className="text-rose-neon">*</span></label>
              <input value={form.venueName} onChange={(e) => setField('venueName', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input value={form.venueCity} onChange={(e) => setField('venueCity', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Adresse <span className="text-rose-neon">*</span></label>
              <input value={form.venueAddress} onChange={(e) => setField('venueAddress', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Billets */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bebas text-lg tracking-wider text-white">Catégories de billets</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addCategory}>
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </Button>
          </div>
          {categories.map((cat, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/[0.03] rounded-xl border border-white/5">
              <div className="sm:col-span-2">
                <label className={labelCls}>Nom</label>
                <input value={cat.name} onChange={(e) => setCategoryField(i, 'name', e.target.value)} placeholder="VIP, Standard…" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Prix (FCFA)</label>
                <input type="number" min={0} value={cat.price} onChange={(e) => setCategoryField(i, 'price', Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Places</label>
                <input type="number" min={1} value={cat.quantityTotal} onChange={(e) => setCategoryField(i, 'quantityTotal', Number(e.target.value))} className={inputCls} />
              </div>
              {categories.length > 1 && (
                <button type="button" onClick={() => removeCategory(i)} className="col-span-2 sm:col-span-4 text-xs text-rose-neon/60 hover:text-rose-neon flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3" /> Supprimer cette catégorie
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" variant="primary" size="md" className="flex-1" isLoading={isSubmitting}>
            <Check className="w-4 h-4" /> Republier l'événement
          </Button>
        </div>
      </form>
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

  // Resynchroniser si le profil est re-fetché (ex: après invalidateQueries)
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
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { data, isLoading } = useOrganizerStats();
  const { data: profile, isLoading: profileLoading } = useOrganizerProfile();
  const [selectedEvent, setSelectedEvent] = useState<OrganizerEventStat | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventNote, setEditingEventNote] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; title: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [promoEvent, setPromoEvent] = useState<OrganizerEventStat | null>(null);
  const [waitlistEvent, setWaitlistEvent] = useState<OrganizerEventStat | null>(null);
  const cancelEvent = useCancelEvent();
  const cloneEvent = useCloneEvent();

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

  if (selectedEvent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BuyersPanel event={selectedEvent} onBack={() => setSelectedEvent(null)} />
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CreateEventForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  if (editingEventId) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <EditEventForm
            key={editingEventId}
            eventId={editingEventId}
            adminNote={editingEventNote}
            onClose={() => { setEditingEventId(null); setEditingEventNote(null); }}
            onSuccess={() => { setEditingEventId(null); setEditingEventNote(null); }}
          />
        </AnimatePresence>
      </div>
    );
  }

  if (promoEvent) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PromoPanel event={promoEvent} onBack={() => setPromoEvent(null)} />
      </div>
    );
  }

  if (waitlistEvent) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <WaitlistPanel event={waitlistEvent} onBack={() => setWaitlistEvent(null)} />
      </div>
    );
  }

  const chartData = (data?.events ?? []).map((e) => ({
    name: e.title.length > 16 ? e.title.slice(0, 16) + '…' : e.title,
    vendus: e.totalSold,
    revenus: e.totalRevenue,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-bebas text-5xl tracking-wider text-gradient leading-none">TABLEAU DE BORD</h1>
            <p className="text-white/40 text-xs mt-1">{user?.firstName} {user?.lastName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/organisateurs"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-neon/20 text-violet-neon text-sm hover:border-violet-neon/50 hover:bg-violet-neon/5 transition-all">
              <span className="hidden sm:inline">Nos offres</span>
              <span className="sm:hidden">Offres</span>
            </Link>
            <Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Créer un événement</span>
            </Button>
            <button
              onClick={async () => { await logout(); navigate('/login'); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-rose-neon hover:border-rose-neon/30 transition-colors text-sm"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
        <p className="text-white/40 mt-1 text-sm">Vue d'ensemble de vos événements et ventes</p>
      </motion.div>

      <MobileMoneyBanner />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Événements" value={data?.eventsCount ?? 0} subtitle="Total créés" Icon={CalendarDays} color="violet" />
        <KpiCard title="Billets vendus" value={(data?.globalSold ?? 0).toLocaleString('fr-FR')} subtitle="Toutes catégories" Icon={Ticket} color="cyan" />
        <KpiCard title="Revenus nets" value={formatPrice(data?.globalRevenue ?? 0)} subtitle="Après commission BilletGo" Icon={TrendingUp} color="green" />
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

      {/* Payouts */}
      <PayoutsSection />

      {/* Events table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bebas text-xl tracking-wider text-white">Mes événements</h2>
          <p className="text-xs text-white/30 hidden sm:block">Cliquer sur un événement pour voir les acheteurs</p>
        </div>

        {!data?.events?.length ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-white/30">Aucun événement créé</p>
            <Button variant="primary" size="md" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4" /> Créer votre premier événement
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                  <th className="text-left px-5 py-3">Événement</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Date</th>
                  <th className="text-right px-5 py-3">Vendus</th>
                  <th className="text-right px-5 py-3 hidden sm:table-cell">Revenus nets</th>
                  <th className="px-5 py-3 hidden xl:table-cell">Forfait</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Remplissage</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.events.map((event) => {
                  const isRevision = event.status === 'NEEDS_REVISION';
                  return (
                    <tr
                      key={event.eventId}
                      onClick={isRevision ? undefined : () => setSelectedEvent(event)}
                      className={`border-b border-white/5 transition-colors group ${isRevision ? 'cursor-default bg-yellow-400/[0.03]' : 'hover:bg-white/[0.03] cursor-pointer'}`}
                    >
                      <td className="px-5 py-4">
                        <p className={`text-white font-semibold line-clamp-1 ${isRevision ? '' : 'group-hover:text-violet-neon transition-colors'}`}>
                          {event.title}
                        </p>
                        {isRevision && event.adminNote && (
                          <p className="text-xs text-yellow-400/70 mt-1 line-clamp-2 leading-relaxed">{event.adminNote}</p>
                        )}
                        {isRevision && event.rejectionReason && (
                          <p className="text-xs text-rose-neon/60 mt-1 line-clamp-1">Refus : {event.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={event.status} />
                        {event.status === 'APPROVED' && event.scheduledPublishAt && (
                          <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.scheduledPublishAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-white/50 text-xs hidden md:table-cell">
                        {formatEventDate(event.eventDate)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-bold text-cyan-neon">{event.totalSold}</span>
                        <span className="text-white/30 text-xs">/{event.totalTickets}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-green-400 font-bold hidden sm:table-cell">
                        {formatPrice(event.totalRevenue)}
                      </td>
                      <td className="px-5 py-4 hidden xl:table-cell">
                        {event.offer ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            event.offer === 'PREMIUM'       ? 'bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/20' :
                            event.offer === 'INTERMEDIAIRE' ? 'bg-rose-neon/10 text-rose-neon border border-rose-neon/20' :
                                                              'bg-violet-neon/10 text-violet-neon border border-violet-neon/20'
                          }`}>
                            {event.offer === 'INTERMEDIAIRE' ? 'Inter.' : event.offer === 'PREMIUM' ? 'Premium' : 'Standard'}
                            <span className="font-mono opacity-70">·{Math.round((event.commissionRate ?? 0.10) * 100)}%</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-neon-gradient rounded-full" style={{ width: `${event.occupancyRate}%` }} />
                          </div>
                          <span className="text-xs text-white/40 w-8 text-right">{event.occupancyRate}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-1.5">
                          {isRevision ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingEventId(event.eventId); setEditingEventNote(event.adminNote); }}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 border border-yellow-400/30 transition-colors whitespace-nowrap"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Modifier
                            </button>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-violet-neon transition-colors" />
                          )}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await cloneEvent.mutateAsync(event.eventId);
                                toast.success('Événement dupliqué en brouillon');
                              } catch {
                                toast.error('Erreur lors de la duplication');
                              }
                            }}
                            disabled={cloneEvent.isLoading}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-cyan-neon/10 hover:text-cyan-neon border border-white/5 hover:border-cyan-neon/20 transition-colors whitespace-nowrap"
                            title="Dupliquer l'événement"
                          >
                            <Copy className="w-3 h-3" /> Dupliquer
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPromoEvent(event); }}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-violet-neon/10 hover:text-violet-neon border border-white/5 hover:border-violet-neon/20 transition-colors whitespace-nowrap"
                            title="Codes promo"
                          >
                            <Tag className="w-3 h-3" /> Promos
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setWaitlistEvent(event); }}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-cyan-neon/10 hover:text-cyan-neon border border-white/5 hover:border-cyan-neon/20 transition-colors whitespace-nowrap"
                            title="Liste d'attente"
                          >
                            <Clock className="w-3 h-3" /> Waitlist
                          </button>
                          {['PUBLISHED', 'APPROVED'].includes(event.status) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setCancelTarget({ id: event.eventId, title: event.title }); }}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-neon/10 text-rose-neon hover:bg-rose-neon/20 border border-rose-neon/20 transition-colors whitespace-nowrap"
                              title="Annuler l'événement"
                            >
                              <Ban className="w-3 h-3" /> Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Modale annulation ── */}
      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setCancelTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md border border-rose-neon/30"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bebas text-2xl tracking-wider text-rose-neon mb-1">ANNULER L'ÉVÉNEMENT</h3>
              <p className="text-white/60 text-sm mb-4">
                <span className="text-white font-semibold">{cancelTarget.title}</span> — Tous les acheteurs seront notifiés par email et in-app.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Motif d'annulation (optionnel mais recommandé)..."
                rows={3}
                className="w-full bg-bg-secondary border border-rose-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-rose-neon resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={async () => {
                    try {
                      const result = await cancelEvent.mutateAsync({ eventId: cancelTarget.id, reason: cancelReason || undefined });
                      toast.success(result.message || 'Événement annulé');
                      setCancelTarget(null);
                      setCancelReason('');
                    } catch {
                      toast.error("Erreur lors de l'annulation");
                    }
                  }}
                  disabled={cancelEvent.isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-neon/20 border border-rose-neon/40 text-rose-neon hover:bg-rose-neon/30 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {cancelEvent.isLoading ? 'Annulation...' : 'Confirmer l\'annulation'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
