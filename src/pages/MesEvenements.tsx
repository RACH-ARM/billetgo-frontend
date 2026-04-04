import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Ticket, Download, Search,
  ChevronRight, ArrowLeft, Phone, Mail, CreditCard,
  Plus, Trash2, AlertTriangle, Check,
  Pencil, Clock, Ban, Tag, X, Banknote, Images, ImagePlus, MapPin,
} from 'lucide-react';
import { useOrganizerStats, useEventBuyers, useCreateEvent, useUpdateEvent, useProposeChanges, useResubmitEvent, useCancelEvent, useEventPromos, useCreatePromoCode, useDeletePromoCode, useOrganizerProfile, useEventDetails, useEventWaitlist, useUploadEventGallery, useDeleteEventGalleryPhoto } from '../hooks/useOrganizer';
import { organizerService, type OrganizerEventStat, type CreateEventTicketCategory } from '../services/organizerService';
import { formatPrice } from '../utils/formatPrice';
import { formatEventDate } from '../utils/formatDate';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import api from '../services/api';

// ── Confirm modal ─────────────────────────────────────────────
function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmer',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
  children,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  const colors = variant === 'danger'
    ? { border: 'border-rose-neon/30', title: 'text-rose-neon', btn: 'bg-rose-neon/20 border-rose-neon/40 text-rose-neon hover:bg-rose-neon/30' }
    : { border: 'border-yellow-400/30', title: 'text-yellow-400', btn: 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/30' };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className={`glass-card p-6 w-full max-w-md border ${colors.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-bebas text-xl tracking-wider ${colors.title}`}>{title}</h3>
          <button onClick={onCancel} className="text-white/30 hover:text-white transition-colors ml-4 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-white/60 text-sm leading-relaxed mb-4">{message}</p>
        {children}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-50 ${colors.btn}`}
          >
            {isLoading ? 'En cours...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

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

// ── CSS helpers ───────────────────────────────────────────────
const inputCls = 'w-full appearance-none bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors';
const labelCls = 'text-xs text-white/40 uppercase tracking-widest block mb-1.5';

const EMPTY_CATEGORY: CreateEventTicketCategory = { name: '', price: 0, quantityTotal: 0, maxPerOrder: 20 };

function parseMapsCoords(url: string): { lat: number; lng: number } | null {
  let m = url.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/[?&]ll=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

// ── Payout planning helpers ────────────────────────────────────
const TIER_SCHEDULES: Record<string, { dayOffset: number; cumPct: number }[]> = {
  NEW:       [{ dayOffset: -3,  cumPct: 0.70 }, { dayOffset:  7, cumPct: 1.00 }],
  APPROVED:  [{ dayOffset: -14, cumPct: 0.40 }, { dayOffset: -3, cumPct: 0.80 }, { dayOffset: 7, cumPct: 1.00 }],
  CERTIFIED: [{ dayOffset: -14, cumPct: 0.60 }, { dayOffset: -3, cumPct: 0.90 }, { dayOffset: 7, cumPct: 1.00 }],
  PREMIUM:   [{ dayOffset: -14, cumPct: 0.80 }, { dayOffset: -3, cumPct: 0.95 }, { dayOffset: 7, cumPct: 1.00 }],
};

function getNextPayout(eventDate: string, tier: string): { date: Date; cumPct: number } | null {
  const base = new Date(eventDate);
  const now = new Date();
  const schedule = TIER_SCHEDULES[tier] ?? TIER_SCHEDULES.NEW;
  for (const { dayOffset, cumPct } of schedule) {
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + dayOffset);
    if (d > now) return { date: d, cumPct };
  }
  return null;
}

// ── Event categories ──────────────────────────────────────────
const EVENT_CATEGORIES = [
  { value: 'CLUB', label: 'Club / Soirée' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'BEACH', label: 'Beach Party' },
  { value: 'CONCERT', label: 'Concert' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'CULTUREL', label: 'Culturel' },
  { value: 'RANDONNEE', label: 'Randonnée' },
  { value: 'AUTRE', label: 'Autre' },
];

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

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async (promoId: string) => {
    try {
      await deletePromo.mutateAsync(promoId);
      toast.success('Code désactivé');
      setDeleteTarget(null);
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
                          onClick={() => setDeleteTarget(promo.id)}
                          className="text-white/20 hover:text-rose-neon transition-colors"
                          title="Désactiver ce code"
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

      {/* Confirmation suppression promo */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmModal
            title="DÉSACTIVER LE CODE"
            message="Ce code promo sera désactivé et ne pourra plus être utilisé. Cette action est irréversible."
            confirmLabel="Désactiver"
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
            isLoading={deletePromo.isLoading}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Create Event Form ──────────────────────────────────────────
const DRAFT_KEY = 'billetgo_create_event_draft';

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function CreateEventForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const createEvent = useCreateEvent();
  const draft = loadDraft();
  const [contractAccepted, setContractAccepted] = useState(false);
  const [form, setForm] = useState(draft?.form ?? {
    title: '', subtitle: '', description: '', category: 'AUTRE',
    offer: 'STANDARD',
    eventDate: '', doorsOpenAt: '', endDate: '', scheduledPublishAt: '',
    venueName: '', venueAddress: '', venueCity: 'Libreville',
    venueLatitude: '' as string | number,
    venueLongitude: '' as string | number,
    maxTicketsPerOrder: 20,
  });
  const [mapsUrl, setMapsUrl] = useState(draft?.mapsUrl ?? '');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [categories, setCategories] = useState<CreateEventTicketCategory[]>(draft?.categories ?? [{ ...EMPTY_CATEGORY }]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCatIndex, setRemoveCatIndex] = useState<number | null>(null);

  const clearDraft = () => sessionStorage.removeItem(DRAFT_KEY);

  // Sauvegarde automatique du brouillon à chaque modification
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, categories, mapsUrl }));
    } catch { /* sessionStorage indisponible */ }
  }, [form, categories, mapsUrl]);

  // Toast de restauration au premier rendu si un brouillon existe
  useEffect(() => {
    if (draft) toast.success('Brouillon restauré', { duration: 3000 });
  }, []);

  const handleMapsUrl = async (url: string) => {
    setMapsUrl(url);
    if (!url.trim()) {
      setForm((f) => ({ ...f, venueLatitude: '', venueLongitude: '' }));
      return;
    }
    const directCoords = parseMapsCoords(url);
    if (directCoords) {
      setForm((f) => ({ ...f, venueLatitude: directCoords.lat, venueLongitude: directCoords.lng }));
      return;
    }
    // Lien court ou lien sans coordonnées visibles — résolution via backend
    setMapsLoading(true);
    try {
      const { data } = await api.get(`/utils/resolve-maps?url=${encodeURIComponent(url)}`);
      setForm((f) => ({ ...f, venueLatitude: data.data.lat, venueLongitude: data.data.lng }));
    } catch {
      setForm((f) => ({ ...f, venueLatitude: '', venueLongitude: '' }));
    } finally {
      setMapsLoading(false);
    }
  };

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

  const scrollTo = (id: string) =>
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);

  // Mapping champ Zod (body.xxx) → id HTML
  const FIELD_IDS: Record<string, string> = {
    'body.title': 'cf-title',
    'body.description': 'cf-description',
    'body.eventDate': 'cf-eventDate',
    'body.endDate': 'cf-endDate',
    'body.doorsOpenAt': 'cf-doorsOpenAt',
    'body.venueName': 'cf-venueName',
    'body.venueAddress': 'cf-venueAddress',
    'body.venueCity': 'cf-venueCity',
    'body.ticketCategories': 'cf-categories',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('Le titre est obligatoire'); scrollTo('cf-title'); return; }
    if (!form.description) { toast.error('La description est obligatoire'); scrollTo('cf-description'); return; }
    if (form.description.length < 20) { toast.error('La description doit faire au moins 20 caractères'); scrollTo('cf-description'); return; }
    if (!form.eventDate) { toast.error("La date de début est obligatoire"); scrollTo('cf-eventDate'); return; }
    if (!form.endDate) { toast.error('La date de fin est obligatoire'); scrollTo('cf-endDate'); return; }
    if (new Date(form.endDate) <= new Date(form.eventDate)) { toast.error("L'heure de fin doit être après le début"); scrollTo('cf-endDate'); return; }
    if (form.doorsOpenAt && new Date(form.endDate) <= new Date(form.doorsOpenAt)) { toast.error("L'heure de fin doit être après l'ouverture des portes"); scrollTo('cf-endDate'); return; }
    if (!form.venueName) { toast.error('Le nom du lieu est obligatoire'); scrollTo('cf-venueName'); return; }
    if (!form.venueAddress) { toast.error("L'adresse est obligatoire"); scrollTo('cf-venueAddress'); return; }
    if (categories.some((c) => !c.name || c.price < 0 || c.quantityTotal <= 0)) { toast.error('Vérifiez les catégories de billets'); scrollTo('cf-categories'); return; }
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
      clearDraft();
      toast.success('Événement soumis — en attente de validation admin');
      onSuccess();
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } })?.response?.data;
      if (res?.errors?.length) {
        const first = res.errors[0];
        toast.error(first.message, { duration: 6000 });
        const fieldId = FIELD_IDS[first.field] ?? FIELD_IDS[first.field.replace(/\.\d+.*/, '')];
        if (fieldId) scrollTo(fieldId);
      } else {
        toast.error(res?.message || 'Erreur lors de la création');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { clearDraft(); onClose(); }} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm">
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
              <input id="cf-title" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Ex: Soirée Libreville Vol.3" className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Nom principal affiché sur la page de l'événement et dans les billets.</p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Sous-titre</label>
              <input value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} placeholder="Ex: La nuit la plus chaude de Libreville" className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Phrase d'accroche affichée sous le titre. Optionnel.</p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description <span className="text-rose-neon">*</span></label>
              <textarea
                id="cf-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Décrivez votre événement..."
                rows={4}
                className={inputCls + ' resize-none'}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-white/30">Décrivez l'ambiance, les artistes, le programme. Minimum 20 caractères.</p>
                <span className={`text-xs font-mono ${form.description.length < 20 ? 'text-rose-neon' : 'text-white/30'}`}>
                  {form.description.length}/20
                </span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Catégorie</label>
              <select value={form.category} onChange={(e) => setField('category', e.target.value)} className={inputCls}>
                {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <p className="text-xs text-white/30 mt-1">Permet aux acheteurs de filtrer les événements par type.</p>
            </div>
            <div>
              <label className={labelCls}>Max billets / commande</label>
              <input type="number" min={1} max={500} value={form.maxTicketsPerOrder || ''} onChange={(e) => setField('maxTicketsPerOrder', Number(e.target.value))} className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Nombre total de billets qu'un seul acheteur peut commander en une fois, toutes catégories confondues.</p>
            </div>
          </div>
        </div>

        {/* Commission */}
        <div className="glass-card p-4 flex items-center gap-3">
          <Banknote className="w-5 h-5 text-violet-neon flex-shrink-0" />
          <p className="text-sm text-white/60">
            <span className="text-white font-semibold">10% de commission</span> prélevée sur chaque billet vendu.
            Les billets gratuits sont soumis à des frais fixes de <span className="text-white font-semibold">500 FCFA</span>.
          </p>
        </div>

        {/* Dates */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Dates & horaires</h3>
          <div className="grid grid-cols-1 gap-4">
            <div id="cf-eventDate">
              <label className={labelCls}>Date & heure de début <span className="text-rose-neon">*</span></label>
              <input type="datetime-local" value={form.eventDate} onChange={(e) => setField('eventDate', e.target.value)} className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Heure à laquelle l'événement commence officiellement.</p>
            </div>
            <div id="cf-endDate">
              <label className={labelCls}>Date & heure de fin <span className="text-rose-neon">*</span></label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Heure de fermeture de l'événement. Détermine quand l'indicateur "EN COURS" s'éteint sur la carte.</p>
            </div>
            <div id="cf-doorsOpenAt">
              <label className={labelCls}>Ouverture des portes</label>
              <input type="datetime-local" value={form.doorsOpenAt} onChange={(e) => setField('doorsOpenAt', e.target.value)} className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Heure à partir de laquelle les acheteurs peuvent entrer. Affiché sur le billet.</p>
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
            <div id="cf-venueName">
              <label className={labelCls}>Nom du lieu <span className="text-rose-neon">*</span></label>
              <input value={form.venueName} onChange={(e) => setField('venueName', e.target.value)} placeholder="Ex: Club Empire" className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Nom de la salle, du club ou de l'espace. Affiché sur le billet.</p>
            </div>
            <div id="cf-venueCity">
              <label className={labelCls}>Ville</label>
              <input value={form.venueCity} onChange={(e) => setField('venueCity', e.target.value)} placeholder="Libreville" className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Ville où se déroule l'événement.</p>
            </div>
            <div className="sm:col-span-2" id="cf-venueAddress">
              <label className={labelCls}>Adresse <span className="text-rose-neon">*</span></label>
              <input value={form.venueAddress} onChange={(e) => setField('venueAddress', e.target.value)} placeholder="Ex: Boulevard Triomphal, Libreville" className={inputCls} />
              <p className="text-xs text-white/30 mt-1">Adresse complète affichée sur le billet et la page de l'événement.</p>
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-start gap-2 bg-cyan-neon/5 border border-cyan-neon/20 rounded-xl px-4 py-3 mb-3">
                <MapPin className="w-4 h-4 text-cyan-neon flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed">
                  Ajoutez le lien de votre lieu sur Google Maps — les acheteurs verront un bouton
                  <span className="text-cyan-neon font-semibold"> "Voir sur Google Maps" </span>
                  sur la page de l'événement pour s'y rendre facilement.
                </p>
              </div>
              <label className={labelCls}>Lien Google Maps <span className="text-white/30 font-normal">(optionnel)</span></label>
              <input
                type="url"
                value={mapsUrl}
                onChange={(e) => handleMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/... ou https://www.google.com/maps/..."
                className={inputCls}
              />
              {mapsLoading ? (
                <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" /> Résolution du lien en cours…
                </p>
              ) : mapsUrl && form.venueLatitude !== '' ? (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Coordonnées extraites — le lien Maps sera précis sur la page événement
                </p>
              ) : mapsUrl ? (
                <p className="text-xs text-yellow-400 mt-1">Lien non reconnu — le nom + adresse sera utilisé pour Maps</p>
              ) : (
                <p className="text-xs text-white/30 mt-1">
                  Optionnel. Sur Google Maps : cherchez votre lieu → appuyez sur "Partager" → "Copier le lien".
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Catégories de billets */}
        <div id="cf-categories" className="glass-card p-6 space-y-4">
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
                  <button type="button" onClick={() => setRemoveCatIndex(i)} className="text-white/20 hover:text-rose-neon transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Nom <span className="text-rose-neon">*</span></label>
                  <input value={cat.name} onChange={(e) => setCategoryField(i, 'name', e.target.value)} placeholder="Ex: Standard, VIP, Carré Or" className={inputCls} />
                  <p className="text-xs text-white/30 mt-1">Nom affiché sur le billet et dans le récapitulatif de commande.</p>
                </div>
                <div>
                  <label className={labelCls}>Prix (FCFA) <span className="text-rose-neon">*</span></label>
                  <input type="number" min={0} value={cat.price || ''} onChange={(e) => setCategoryField(i, 'price', Number(e.target.value))} placeholder="5000" className={inputCls} />
                  <p className="text-xs text-white/30 mt-1">Mettre 0 pour un billet gratuit (frais fixes de 500 FCFA appliqués).</p>
                </div>
                <div>
                  <label className={labelCls}>Quantité <span className="text-rose-neon">*</span></label>
                  <input type="number" min={1} value={cat.quantityTotal || ''} onChange={(e) => setCategoryField(i, 'quantityTotal', Number(e.target.value))} placeholder="100" className={inputCls} />
                  <p className="text-xs text-white/30 mt-1">Nombre total de billets disponibles pour cette catégorie.</p>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <input value={cat.description ?? ''} onChange={(e) => setCategoryField(i, 'description', e.target.value)} placeholder="Ex: Accès dancefloor" className={inputCls} />
                  <p className="text-xs text-white/30 mt-1">Avantages ou accès inclus dans cette catégorie. Optionnel.</p>
                </div>
                <div>
                  <label className={labelCls}>Max / commande</label>
                  <input type="number" min={1} max={200} value={cat.maxPerOrder || ''} onChange={(e) => setCategoryField(i, 'maxPerOrder', Number(e.target.value))} className={inputCls} />
                  <p className="text-xs text-white/30 mt-1">Limite de billets pour cette catégorie spécifique par acheteur.</p>
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
            <span className="text-white font-semibold">10%</span>{' '}
            prélevée sur chaque billet vendu.
            Je certifie être habilité à soumettre cet événement.
          </span>
        </label>

        <div className="flex gap-3 pb-8">
          <Button type="button" variant="secondary" size="lg" onClick={() => { clearDraft(); onClose(); }} className="flex-1">
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

      <AnimatePresence>
        {removeCatIndex !== null && (
          <ConfirmModal
            title="SUPPRIMER LA CATÉGORIE"
            message={`La catégorie "${categories[removeCatIndex]?.name || `Catégorie ${removeCatIndex + 1}`}" sera supprimée du formulaire.`}
            confirmLabel="Supprimer"
            onConfirm={() => { removeCategory(removeCatIndex); setRemoveCatIndex(null); }}
            onCancel={() => setRemoveCatIndex(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Edit Event Form ────────────────────────────────────────────
function EditEventForm({ eventId, eventStatus, adminNote, onClose, onSuccess }: {
  eventId: string;
  eventStatus: string;
  adminNote: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: eventData, isLoading: loadingEvent } = useEventDetails(eventId);
  const updateEvent = useUpdateEvent();
  const proposeChanges = useProposeChanges();
  const resubmitEvent = useResubmitEvent();
  const uploadGallery = useUploadEventGallery();
  const deleteGalleryPhoto = useDeleteEventGalleryPhoto();
  const isDraft = eventStatus === 'DRAFT';
  const isPropose = ['PUBLISHED', 'APPROVED'].includes(eventStatus);
  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '', category: 'AUTRE',
    eventDate: '', doorsOpenAt: '', endDate: '', scheduledPublishAt: '',
    venueName: '', venueAddress: '', venueCity: 'Libreville',
    venueLatitude: '' as string | number,
    venueLongitude: '' as string | number,
    maxTicketsPerOrder: 20,
  });
  const [mapsUrl, setMapsUrl] = useState('');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [categories, setCategories] = useState<CreateEventTicketCategory[]>([{ ...EMPTY_CATEGORY }]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCatIndex, setRemoveCatIndex] = useState<number | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const handleMapsUrl = async (url: string) => {
    setMapsUrl(url);
    if (!url.trim()) {
      setForm((f) => ({ ...f, venueLatitude: '', venueLongitude: '' }));
      return;
    }
    const directCoords = parseMapsCoords(url);
    if (directCoords) {
      setForm((f) => ({ ...f, venueLatitude: directCoords.lat, venueLongitude: directCoords.lng }));
      return;
    }
    setMapsLoading(true);
    try {
      const { data } = await api.get(`/utils/resolve-maps?url=${encodeURIComponent(url)}`);
      setForm((f) => ({ ...f, venueLatitude: data.data.lat, venueLongitude: data.data.lng }));
    } catch {
      setForm((f) => ({ ...f, venueLatitude: '', venueLongitude: '' }));
    } finally {
      setMapsLoading(false);
    }
  };

  useEffect(() => {
    if (eventData && !initialized) {
      const ed = eventData as Record<string, unknown>;
      setGalleryUrls((ed.galleryUrls as string[]) ?? []);
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
        venueLatitude: (ed.venueLatitude as number | null) ?? '',
        venueLongitude: (ed.venueLongitude as number | null) ?? '',
        maxTicketsPerOrder: (ed.maxTicketsPerOrder as number) ?? 10,
      });
      const cats = ed.ticketCategories as Array<{ id?: string; name: string; description?: string; price: number; quantityTotal: number; maxPerOrder?: number }>;
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats.map((c) => ({ id: c.id, name: c.name, description: c.description, price: c.price, quantityTotal: c.quantityTotal, maxPerOrder: c.maxPerOrder ?? 10 })));
      }
      if (ed.coverImageUrl) setCoverPreview(ed.coverImageUrl as string);
      setInitialized(true);
    } else if (eventData && initialized) {
      // Sync gallery when cache updates (after upload/delete)
      const ed = eventData as Record<string, unknown>;
      setGalleryUrls((ed.galleryUrls as string[]) ?? []);
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
    if (!form.endDate) {
      toast.error('La date de fin est obligatoire');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.eventDate)) {
      toast.error("L'heure de fin doit être après le début de l'événement");
      return;
    }
    if (form.doorsOpenAt && new Date(form.endDate) <= new Date(form.doorsOpenAt)) {
      toast.error("L'heure de fin doit être après l'ouverture des portes");
      return;
    }
    if (categories.some((c) => !c.name || c.price < 0 || c.quantityTotal <= 0)) {
      toast.error('Vérifiez les catégories de billets');
      return;
    }
    try {
      const payload = {
        ...form,
        doorsOpenAt: form.doorsOpenAt || undefined,
        endDate: form.endDate || undefined,
        scheduledPublishAt: form.scheduledPublishAt || undefined,
        ticketCategories: categories,
      };

      if (isPropose) {
        // Événement publié/approuvé : soumettre une proposition de modifications
        await proposeChanges.mutateAsync({ eventId, payload, coverImage: coverImage ?? undefined });
        toast.success('Modifications soumises — en attente d\'approbation par l\'administrateur');
      } else {
        // Brouillon ou en révision : mise à jour directe
        await updateEvent.mutateAsync({ eventId, payload, coverImage: coverImage ?? undefined });
        if (!isDraft) {
          await resubmitEvent.mutateAsync(eventId);
          toast.success('Événement mis à jour et republié pour validation');
        } else {
          toast.success('Brouillon sauvegardé');
        }
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erreur lors de la mise à jour');
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 10 - galleryUrls.length;
    const toUpload = files.slice(0, remaining);
    try {
      await uploadGallery.mutateAsync({ eventId, photos: toUpload });
      toast.success(`${toUpload.length} photo${toUpload.length > 1 ? 's' : ''} ajoutée${toUpload.length > 1 ? 's' : ''}`);
    } catch {
      toast.error('Erreur lors de l\'upload des photos');
    }
    e.target.value = '';
  };

  const handleGalleryDelete = async (url: string) => {
    try {
      await deleteGalleryPhoto.mutateAsync({ eventId, url });
    } catch {
      toast.error('Erreur lors de la suppression');
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
        <h2 className="font-bebas text-3xl tracking-wider text-gradient">
          {isPropose ? 'PROPOSER DES MODIFICATIONS' : 'MODIFIER L\'ÉVÉNEMENT'}
        </h2>
      </div>

      {isPropose && (
        <div className="mb-6 p-4 glass-card border border-violet-neon/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-violet-neon flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-violet-neon/70 uppercase tracking-widest mb-1">Événement publié — modifications soumises à validation</p>
            <p className="text-white/60 text-sm">Vos modifications ne seront appliquées qu'après approbation par l'administrateur. L'événement reste en ligne tel quel en attendant.</p>
          </div>
        </div>
      )}

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

        {/* Galerie photos */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bebas text-lg tracking-wider text-white flex items-center gap-2">
              <Images className="w-4 h-4 text-violet-neon" /> Galerie photos
            </h3>
            <span className="text-xs text-white/30">{galleryUrls.length}/10</span>
          </div>

          {galleryUrls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {galleryUrls.map((url) => (
                <div key={url} className="relative group aspect-square">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    disabled={deleteGalleryPhoto.isLoading}
                    onClick={() => handleGalleryDelete(url)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-neon/80"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {galleryUrls.length < 10 && (
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
                disabled={uploadGallery.isLoading}
              />
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-sm transition-colors ${
                uploadGallery.isLoading
                  ? 'border-white/10 text-white/30 cursor-not-allowed'
                  : 'border-violet-neon/30 text-violet-neon/70 hover:border-violet-neon hover:text-violet-neon'
              }`}>
                {uploadGallery.isLoading ? (
                  <div className="w-4 h-4 border-2 border-violet-neon/30 border-t-violet-neon rounded-full animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
                {uploadGallery.isLoading ? 'Upload en cours...' : `Ajouter des photos (${10 - galleryUrls.length} restante${10 - galleryUrls.length > 1 ? 's' : ''})`}
              </div>
            </label>
          )}
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
              <input type="number" min={1} max={500} value={form.maxTicketsPerOrder || ''} onChange={(e) => setField('maxTicketsPerOrder', Number(e.target.value))} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bebas text-lg tracking-wider text-white border-b border-white/5 pb-3">Dates</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelCls}>Date & heure de début <span className="text-rose-neon">*</span></label>
              <input type="datetime-local" value={form.eventDate} onChange={(e) => setField('eventDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fin de l'événement <span className="text-rose-neon">*</span></label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ouverture des portes</label>
              <input type="datetime-local" value={form.doorsOpenAt} onChange={(e) => setField('doorsOpenAt', e.target.value)} className={inputCls} />
            </div>
            {!isPropose && (
              <div>
                <label className={labelCls}>Publication programmée <span className="text-white/30 font-normal">(optionnel)</span></label>
                <input type="datetime-local" value={form.scheduledPublishAt} onChange={(e) => setField('scheduledPublishAt', e.target.value)} className={inputCls} />
                <p className="text-xs text-white/30 mt-1">Laissez vide pour une publication immédiate après approbation.</p>
              </div>
            )}
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
            <div className="sm:col-span-2">
              <div className="flex items-start gap-2 bg-cyan-neon/5 border border-cyan-neon/20 rounded-xl px-4 py-3 mb-3">
                <MapPin className="w-4 h-4 text-cyan-neon flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed">
                  Ajoutez le lien de votre lieu sur Google Maps — les acheteurs verront un bouton
                  <span className="text-cyan-neon font-semibold"> "Voir sur Google Maps" </span>
                  sur la page de l'événement pour s'y rendre facilement.
                </p>
              </div>
              <label className={labelCls}>Lien Google Maps <span className="text-white/30 font-normal">(optionnel)</span></label>
              <input
                type="url"
                value={mapsUrl}
                onChange={(e) => handleMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/... ou https://www.google.com/maps/..."
                className={inputCls}
              />
              {form.venueLatitude !== '' && !mapsUrl && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Coordonnées déjà enregistrées — collez un nouveau lien pour les modifier
                </p>
              )}
              {mapsLoading ? (
                <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" /> Résolution du lien en cours…
                </p>
              ) : mapsUrl && form.venueLatitude !== '' ? (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Coordonnées extraites — le lien Maps sera précis sur la page événement
                </p>
              ) : mapsUrl ? (
                <p className="text-xs text-yellow-400 mt-1">Lien non reconnu — le nom + adresse sera utilisé pour Maps</p>
              ) : (
                <p className="text-xs text-white/30 mt-1">
                  Optionnel. Sur Google Maps : cherchez votre lieu → appuyez sur "Partager" → "Copier le lien".
                </p>
              )}
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
                <input type="number" min={0} value={cat.price || ''} onChange={(e) => setCategoryField(i, 'price', Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Places</label>
                <input type="number" min={1} value={cat.quantityTotal || ''} onChange={(e) => setCategoryField(i, 'quantityTotal', Number(e.target.value))} className={inputCls} />
              </div>
              {categories.length > 1 && (
                <button type="button" onClick={() => setRemoveCatIndex(i)} className="col-span-2 sm:col-span-4 text-xs text-rose-neon/60 hover:text-rose-neon flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3" /> Supprimer cette catégorie
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" variant="primary" size="md" className="flex-1" isLoading={isSubmitting}>
            <Check className="w-4 h-4" /> {isPropose ? 'Soumettre pour approbation' : isDraft ? 'Sauvegarder le brouillon' : 'Soumettre les modifications'}
          </Button>
        </div>
      </form>

      <AnimatePresence>
        {removeCatIndex !== null && (
          <ConfirmModal
            title="SUPPRIMER LA CATÉGORIE"
            message={`La catégorie "${categories[removeCatIndex]?.name || `Catégorie ${removeCatIndex + 1}`}" sera supprimée.`}
            confirmLabel="Supprimer"
            onConfirm={() => { removeCategory(removeCatIndex); setRemoveCatIndex(null); }}
            onCancel={() => setRemoveCatIndex(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function MesEvenements() {
  const { data, isLoading } = useOrganizerStats();
  const { data: profile } = useOrganizerProfile();
  const tier = profile?.tier ?? 'NEW';
  const [selectedEvent, setSelectedEvent] = useState<OrganizerEventStat | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventNote, setEditingEventNote] = useState<string | null>(null);
  const [editingEventStatus, setEditingEventStatus] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; title: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [promoEvent, setPromoEvent] = useState<OrganizerEventStat | null>(null);
  const [waitlistEvent, setWaitlistEvent] = useState<OrganizerEventStat | null>(null);
  const cancelEvent = useCancelEvent();

  // Redirect if profile not loaded or not approved — dashboard handles that guard
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
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
            eventStatus={editingEventStatus ?? 'NEEDS_REVISION'}
            adminNote={editingEventNote}
            onClose={() => { setEditingEventId(null); setEditingEventNote(null); setEditingEventStatus(null); }}
            onSuccess={() => { setEditingEventId(null); setEditingEventNote(null); setEditingEventStatus(null); }}
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bebas text-4xl tracking-wider text-gradient leading-none">MES ÉVÉNEMENTS</h1>
          <p className="text-white/40 text-xs mt-1">
            {profile?.companyName ?? ''} · {data?.eventsCount ?? 0} événement{(data?.eventsCount ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Créer un événement</span>
        </Button>
      </div>

      {/* Events table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-violet-neon" />
            <h2 className="font-bebas text-xl tracking-wider text-white">Tous les événements</h2>
          </div>
          <p className="text-xs text-white/30 hidden sm:block">Appuyez sur un événement pour voir les acheteurs</p>
        </div>

        {!data?.events?.length ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-violet-neon/10 border border-violet-neon/20 flex items-center justify-center">
              <Ticket className="w-7 h-7 text-violet-neon/60" />
            </div>
            <div className="space-y-1.5">
              <p className="text-white font-semibold">Aucun événement pour l'instant</p>
              <p className="text-white/35 text-sm max-w-xs">Créez votre premier événement et commencez à vendre des billets en quelques minutes.</p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4" /> Créer votre premier événement
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.events.map((event) => {
              const isRevision = event.status === 'NEEDS_REVISION';
              const hasPending = (event as any).pendingStatus === 'PENDING';
              const pendingRejected = (event as any).pendingStatus === 'REJECTED';
              const isEditable = !['CANCELLED', 'COMPLETED', 'PENDING_REVIEW'].includes(event.status);
              const nextPayout = event.status === 'PUBLISHED' ? getNextPayout(event.eventDate, tier) : null;
              return (
                <div
                  key={event.eventId}
                  onClick={isRevision || hasPending ? undefined : () => setSelectedEvent(event)}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors group ${isRevision || hasPending ? 'cursor-default' : 'hover:bg-white/[0.03] cursor-pointer'} ${isRevision ? 'bg-yellow-400/[0.02]' : hasPending ? 'bg-violet-neon/[0.02]' : ''}`}
                >
                  {/* Vignette cover */}
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-bg-secondary border border-white/5">
                    {event.coverImageUrl
                      ? <img src={event.coverImageUrl} alt="" className="w-full h-full object-cover opacity-80" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2D1060,#0D0D1A 60%,#003060)' }}>
                          <Ticket className="w-5 h-5 text-white/20" />
                        </div>
                    }
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm leading-snug truncate ${isRevision ? 'text-yellow-300' : 'text-white group-hover:text-violet-neon transition-colors'}`}>
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-white/35 text-xs">{formatEventDate(event.eventDate)}</span>
                          {event.category && (
                            <span className="text-xs text-white/25 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                              {event.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={event.status} />
                    </div>

                    {/* Messages contextuels */}
                    {isRevision && event.adminNote && (
                      <p className="text-xs text-yellow-400/70 mt-1.5 line-clamp-2 leading-relaxed">{event.adminNote}</p>
                    )}
                    {isRevision && event.rejectionReason && (
                      <p className="text-xs text-rose-neon/60 mt-1 flex items-center gap-1"><X className="w-3 h-3 flex-shrink-0" /> {event.rejectionReason}</p>
                    )}
                    {hasPending && (
                      <p className="text-xs text-violet-neon/60 mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3 flex-shrink-0" /> Modifications en attente d'approbation</p>
                    )}
                    {pendingRejected && (
                      <p className="text-xs text-rose-neon/60 mt-1.5 flex items-center gap-1"><X className="w-3 h-3 flex-shrink-0" /> Modifications refusées{(event as any).pendingAdminNote ? ` — ${(event as any).pendingAdminNote}` : ''}</p>
                    )}
                    {event.status === 'APPROVED' && event.scheduledPublishAt && (
                      <p className="text-xs text-white/30 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        Publication prévue le {new Date(event.scheduledPublishAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {nextPayout && (
                      <p className="text-xs text-cyan-neon/50 mt-1.5 flex items-center gap-1">
                        <Banknote className="w-3 h-3 flex-shrink-0" />
                        Prochain versement : jusqu'à {Math.round(nextPayout.cumPct * 100)}% le {nextPayout.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </p>
                    )}

                    {/* Métriques + barre de remplissage */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-cyan-neon text-sm">{event.totalSold}</span>
                        <span className="text-white/25 text-xs">/ {event.totalTickets} billets</span>
                      </div>
                      <span className="font-mono font-bold text-green-400 text-sm">{formatPrice(event.totalRevenue)}</span>
                      <div className="flex items-center gap-2 min-w-[90px]">
                        <div className="flex-1 h-1 bg-bg-secondary rounded-full overflow-hidden min-w-[60px]">
                          <div className="h-full bg-neon-gradient rounded-full transition-all" style={{ width: `${event.occupancyRate}%` }} />
                        </div>
                        <span className="text-xs text-white/30 tabular-nums w-7 text-right">{event.occupancyRate}%</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {hasPending ? (
                        <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-violet-neon/10 text-violet-neon/60 border border-violet-neon/20">
                          <Clock className="w-3.5 h-3.5" /> En attente
                        </span>
                      ) : isEditable ? (
                        <button
                          onClick={() => { setEditingEventId(event.eventId); setEditingEventNote(event.adminNote ?? null); setEditingEventStatus(event.status); }}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            isRevision
                              ? 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 border-yellow-400/30'
                              : ['PUBLISHED', 'APPROVED'].includes(event.status)
                              ? 'bg-violet-neon/10 text-violet-neon hover:bg-violet-neon/20 border-violet-neon/30'
                              : 'bg-white/5 text-white/50 hover:bg-violet-neon/10 hover:text-violet-neon border-white/10 hover:border-violet-neon/30'
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {['PUBLISHED', 'APPROVED'].includes(event.status) ? 'Proposer modif.' : 'Modifier'}
                        </button>
                      ) : null}
                      <button
                        onClick={() => setPromoEvent(event)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-violet-neon/10 hover:text-violet-neon border border-white/5 hover:border-violet-neon/20 transition-colors"
                      >
                        <Tag className="w-3 h-3" /> Promos
                      </button>
                      <button
                        onClick={() => setWaitlistEvent(event)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-cyan-neon/10 hover:text-cyan-neon border border-white/5 hover:border-cyan-neon/20 transition-colors"
                      >
                        <Clock className="w-3 h-3" /> Waitlist
                      </button>
                      {['PUBLISHED', 'APPROVED'].includes(event.status) && (
                        <button
                          onClick={() => setCancelTarget({ id: event.eventId, title: event.title })}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-neon/10 text-rose-neon hover:bg-rose-neon/20 border border-rose-neon/20 transition-colors"
                        >
                          <Ban className="w-3 h-3" /> Annuler
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  {!isRevision && !hasPending && (
                    <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-violet-neon transition-colors flex-shrink-0 mt-1 hidden sm:block" />
                  )}
                </div>
              );
            })}
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
