import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CalendarDays, TrendingUp, Clock, CheckCircle, XCircle,
  ShieldAlert, LayoutDashboard, ListChecks, X, LogOut, Banknote,
  Star, Flame, Ban, Sparkles, ScanLine, Plus, Eye, EyeOff, Pencil, MessageSquare, FileSearch, RotateCcw, ScrollText, Settings,
  Square, CheckSquare, BadgeCheck, MapPin, QrCode, Download, ShoppingCart, UserCheck,
  ChevronDown, ChevronLeft, ChevronRight, Search, AlertCircle, Heart, Ticket, Link2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/common/Button';
import { SkeletonKpiGrid, SkeletonCard, SkeletonTable } from '../components/common/Skeleton';
import { formatPrice } from '../utils/formatPrice';
import { formatEventDate } from '../utils/formatDate';
import toast from 'react-hot-toast';

type TabType = 'dashboard' | 'events' | 'vitrine' | 'users' | 'retraits' | 'scanners' | 'refunds' | 'audit' | 'settings' | 'influenceurs';

// ── Types ─────────────────────────────────────────────────────
interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  newData: unknown;
  oldData: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; role: string } | null;
}

interface PayoutHistoryEntry {
  id: string;
  amountSent: number;
  mobileMoney: string;
  operator: string;
  transactionRef: string | null;
  noteAdmin: string | null;
  processedAt: string;
  processedBy: string;
  pvitStatus: string;
}
interface AdminPayoutOrganizer {
  organizerId: string;
  companyName: string;
  mobileMoneyNumber: string | null;
  airtelNumber: string | null;
  moovNumber: string | null;
  airtelBalance: number;
  moovBalance: number;
  user: { firstName: string; lastName: string; email: string; phone: string };
  events: { id: string; title: string; eventDate: string }[];
  totalCollected: number;
  totalPlatformFee: number;
  totalNetAmount: number;
  totalPaid: number;
  balanceDue: number;
  payoutHistory: PayoutHistoryEntry[];
  isApproved?: boolean;
  isCertified?: boolean;
  isPremium?: boolean;
}

// ── Event Preview ─────────────────────────────────────────────
interface PreviewEventData {
  id?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  description?: string;
  coverImageUrl?: string;
  galleryUrls?: string[];
  eventDate?: string;
  doorsOpenAt?: string;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  isFeatured?: boolean;
  isCertified?: boolean;
  organizer?: {
    companyName?: string;
    businessName?: string;
    logoUrl?: string;
    isCertified?: boolean;
    description?: string;
    user?: { firstName?: string; lastName?: string };
  };
  ticketCategories?: Array<{
    name: string;
    price: number;
    quantityTotal: number;
    quantitySold?: number;
    description?: string;
    isVisible?: boolean;
    sortOrder?: number;
  }>;
}

function EventPreviewModal({ event, onClose }: { event: PreviewEventData; onClose: () => void }) {
  const allImages = [
    ...(event.coverImageUrl ? [event.coverImageUrl] : []),
    ...(event.galleryUrls ?? []),
  ];
  const orgName = event.organizer?.companyName
    ?? event.organizer?.businessName
    ?? [event.organizer?.user?.firstName, event.organizer?.user?.lastName].filter(Boolean).join(' ')
    ?? 'Organisateur';
  const visibleCats = (event.ticketCategories ?? [])
    .filter(c => c.isVisible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen py-6 px-4 flex flex-col items-center">
        {/* Barre d'outils */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-neon/15 border border-violet-neon/30 text-violet-neon text-sm">
            <Eye className="w-4 h-4" />
            Prévisualisation — vue acheteur
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cadre de prévisualisation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="w-full max-w-4xl bg-bg rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Hero banner */}
          <div className="relative h-64 md:h-96 overflow-hidden">
            {event.coverImageUrl ? (
              <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap gap-2 mb-2">
                {event.category && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-violet-neon/25 border border-violet-neon/40 text-violet-neon font-semibold">
                    {event.category}
                  </span>
                )}
                {event.isFeatured && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-rose-neon/25 border border-rose-neon/40 text-rose-neon font-semibold">
                    À LA UNE
                  </span>
                )}
              </div>
              <h1 className="font-bebas text-4xl md:text-6xl tracking-wider text-white drop-shadow-2xl leading-none">
                {event.title}
              </h1>
              {event.subtitle && (
                <p className="text-white/70 mt-1.5 text-base">{event.subtitle}</p>
              )}
            </div>
          </div>

          {/* Corps */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-4">

              {/* Date */}
              {event.eventDate && (
                <div className="glass-card p-4 flex flex-wrap gap-6 items-center">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-white font-semibold">{formatEventDate(event.eventDate)}</p>
                  </div>
                  {event.doorsOpenAt && (
                    <>
                      <div className="w-px h-8 bg-white/10" />
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Ouverture des portes</p>
                        <p className="text-white/70 font-mono text-sm">
                          {new Date(event.doorsOpenAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="glass-card p-5">
                  <h2 className="font-bebas text-lg tracking-wider text-white mb-3">À propos</h2>
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
                </div>
              )}

              {/* Galerie */}
              {allImages.length > 1 && (
                <div className="glass-card p-4">
                  <h2 className="font-bebas text-lg tracking-wider text-white mb-3">Galerie</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {allImages.slice(0, 8).map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover opacity-80" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lieu */}
              {event.venueName && (
                <div className="glass-card p-5">
                  <h2 className="font-bebas text-lg tracking-wider text-white mb-3">Lieu</h2>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-neon/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-violet-neon" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{event.venueName}</p>
                      {event.venueAddress && <p className="text-white/50 text-sm mt-0.5">{event.venueAddress}</p>}
                      {event.venueCity && <p className="text-white/50 text-sm">{event.venueCity}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Organisateur */}
              <div className="glass-card p-5">
                <h2 className="font-bebas text-lg tracking-wider text-white mb-3">Organisateur</h2>
                <div className="flex items-center gap-3">
                  {event.organizer?.logoUrl ? (
                    <img src={event.organizer.logoUrl} alt={orgName} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bebas text-xl flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #7B2FBE, #00E5FF)' }}
                    >
                      {orgName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold">{orgName}</p>
                      {(event.isCertified || event.organizer?.isCertified) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30 font-semibold">
                          ✓ Certifié
                        </span>
                      )}
                    </div>
                    {event.organizer?.description && (
                      <p className="text-white/50 text-sm mt-0.5 line-clamp-2">{event.organizer.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne billets */}
            <div className="space-y-3">
              <h2 className="font-bebas text-xl tracking-wider text-white">Billets disponibles</h2>
              {visibleCats.length === 0 ? (
                <div className="glass-card p-5 text-center text-white/30 text-sm border border-dashed border-white/10">
                  Aucune catégorie de billet définie
                </div>
              ) : visibleCats.map((cat, i) => (
                <div key={i} className="glass-card p-4 border border-violet-neon/20">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-white">{cat.name}</h3>
                    <span className="font-mono font-bold text-cyan-neon text-sm">{formatPrice(cat.price)}</span>
                  </div>
                  {cat.description && <p className="text-xs text-white/50 mb-2">{cat.description}</p>}
                  <p className="text-xs text-white/30 mb-3">{cat.quantityTotal} places disponibles</p>
                  <div className="w-full py-2 rounded-xl text-sm font-semibold text-center bg-violet-neon/10 border border-violet-neon/20 text-violet-neon/60 cursor-default select-none">
                    Ajouter au panier
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-white/20 text-xs mt-4 mb-2">Cliquez en dehors pour fermer</p>
      </div>
    </motion.div>
  );
}

// ── Role badge ────────────────────────────────────────────────
const ROLE_STYLE: Record<string, string> = {
  ADMIN:     'bg-rose-neon/20 text-rose-neon',
  ORGANIZER: 'bg-violet-neon/20 text-violet-neon',
  BUYER:     'bg-cyan-neon/20 text-cyan-neon',
  SCANNER:   'bg-yellow-500/20 text-yellow-400',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_STYLE[role] ?? 'bg-white/10 text-white/50'}`}>
      {role}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ title, value, subtitle, Icon, color }: {
  title: string; value: string | number; subtitle?: string;
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`glass-card p-5 border ${c.border}`}>
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

// ── Reject modal ──────────────────────────────────────────────
function RejectModal({ eventTitle, onConfirm, onCancel }: {
  eventTitle: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-md border border-rose-neon/30 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bebas text-xl tracking-wider text-rose-neon">REFUSER L'ÉVÉNEMENT</h3>
          <button onClick={onCancel} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-white/60 text-sm mb-4">« {eventTitle} »</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motif de refus (obligatoire)..."
          rows={3}
          className="w-full bg-bg-secondary border border-rose-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-rose-neon transition-colors text-sm resize-none mb-4"
        />
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1">Annuler</Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex-1"
          >
            Confirmer le refus
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Revision modal ────────────────────────────────────────────
function RevisionModal({ eventTitle, onConfirm, onCancel }: {
  eventTitle: string;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-md border border-yellow-400/30 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bebas text-xl tracking-wider text-yellow-400">DEMANDER UNE RÉVISION</h3>
          <button onClick={onCancel} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-white/60 text-sm mb-4">« {eventTitle} »</p>
        <p className="text-xs text-white/40 mb-2">Précisez les modifications attendues. L'organisateur recevra ce message.</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ex: Veuillez corriger l'adresse du lieu et ajouter une image de couverture..."
          rows={4}
          className="w-full bg-bg-secondary border border-yellow-400/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 transition-colors text-sm resize-none mb-4"
        />
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1">Annuler</Button>
          <Button
            size="sm"
            onClick={() => comment.trim() && onConfirm(comment)}
            disabled={!comment.trim()}
            className="flex-1 bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/30"
          >
            Envoyer la demande
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Edit scanner modal ─────────────────────────────────────────
interface ScannerRow {
  id: string;
  isActive: boolean;
  createdAt: string;
  scanCount: number;
  validScanCount: number;
  lastScanAt: string | null;
  user: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null; isActive: boolean; createdAt: string; scannerPassword: string | null };
  events: { id: string; title: string; eventDate: string; venueCity?: string; organizer?: { companyName: string } }[];
  assignedByUser?: { firstName: string; lastName: string };
}

function EditScannerModal({
  scanner,
  events,
  onClose,
  onSave,
  isLoading,
}: {
  scanner: ScannerRow;
  events: { id: string; title: string }[];
  onClose: () => void;
  onSave: (id: string, data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const currentEventIds = scanner.events.map((e) => e.id);

  const [firstName, setFirstName] = useState(scanner.user.firstName);
  const [lastName, setLastName] = useState(scanner.user.lastName);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(currentEventIds);
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const allSelected = selectedEventIds.length === events.length;
  const toggleAll = () => setSelectedEventIds(allSelected ? [] : events.map((e) => e.id));
  const toggleEvent = (id: string) => setSelectedEventIds((prev) =>
    prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id]
  );

  const inputCls = 'w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors';
  const labelCls = 'text-xs text-white/40 uppercase tracking-widest block mb-1.5';
  const infoLabelCls = 'text-[10px] text-white/30 uppercase tracking-widest mb-0.5';
  const infoValueCls = 'text-sm text-white/80';

  const handleSave = () => {
    const payload: Record<string, unknown> = {};
    if (firstName !== scanner.user.firstName) payload.firstName = firstName;
    if (lastName !== scanner.user.lastName) payload.lastName = lastName;
    if (newPassword.trim()) payload.newPassword = newPassword;
    payload.eventIds = selectedEventIds;
    onSave(scanner.id, payload);
  };

  const successRate = scanner.scanCount > 0
    ? Math.round((scanner.validScanCount / scanner.scanCount) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-lg border border-violet-neon/30 flex flex-col max-h-[90vh]"
      >
        {/* Header — fixe */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 flex-shrink-0">
          <div>
            <h3 className="font-bebas text-xl tracking-wider text-white">
              {scanner.user.firstName} {scanner.user.lastName}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scanner.user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-rose-neon/20 text-rose-neon'}`}>
              {scanner.user.isActive ? 'Actif' : 'Bloqué'}
            </span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Contenu scrollable */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

          {/* ── Infos lecture seule ── */}
          <div className="bg-white/[0.03] rounded-xl p-4 grid grid-cols-2 gap-4">
            <div>
              <p className={infoLabelCls}>Téléphone</p>
              <p className={`${infoValueCls} font-mono`}>{scanner.user.phone ?? '—'}</p>
            </div>
            <div>
              <p className={infoLabelCls}>Mot de passe</p>
              <p className={`${infoValueCls} font-mono tracking-wider`}>{scanner.user.scannerPassword ?? '—'}</p>
            </div>
            <div>
              <p className={infoLabelCls}>Email</p>
              <p className={infoValueCls}>{scanner.user.email ?? '—'}</p>
            </div>
            <div>
              <p className={infoLabelCls}>Compte créé le</p>
              <p className={infoValueCls}>{new Date(scanner.user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="col-span-2">
              <p className={infoLabelCls}>Assigné par</p>
              <p className={infoValueCls}>{scanner.assignedByUser ? `${scanner.assignedByUser.firstName} ${scanner.assignedByUser.lastName}` : '—'}</p>
            </div>
          </div>

          {/* ── Stats scans ── */}
          <div className="bg-white/[0.03] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Activité de scan</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="font-bebas text-2xl text-white">{scanner.scanCount}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Total scans</p>
              </div>
              <div className="text-center">
                <p className="font-bebas text-2xl text-green-400">{scanner.validScanCount}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Valides</p>
              </div>
              <div className="text-center">
                <p className={`font-bebas text-2xl ${successRate !== null ? (successRate >= 90 ? 'text-green-400' : successRate >= 70 ? 'text-yellow-400' : 'text-rose-neon') : 'text-white/20'}`}>
                  {successRate !== null ? `${successRate}%` : '—'}
                </p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Taux succès</p>
              </div>
            </div>
            {scanner.lastScanAt && (
              <p className="text-xs text-white/30 mt-3 text-center">
                Dernier scan : {new Date(scanner.lastScanAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {!scanner.scanCount && (
              <p className="text-xs text-white/20 text-center mt-1">Aucun scan effectué pour l'instant</p>
            )}
          </div>

          {/* ── Champs modifiables ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Prénom</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nom</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Événements */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-white/40 uppercase tracking-widest">
                Événements assignés
                {selectedEventIds.length > 0 && (
                  <span className="ml-2 text-cyan-neon normal-case tracking-normal">{selectedEventIds.length} sélectionné{selectedEventIds.length > 1 ? 's' : ''}</span>
                )}
              </label>
              <button type="button" onClick={toggleAll} className="text-xs text-violet-neon hover:text-white transition-colors">
                {allSelected ? 'Désélectionner tout' : 'Tout'}
              </button>
            </div>
            <div className="border border-violet-neon/20 rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-bg-secondary">
              {events.map((ev) => {
                const checked = selectedEventIds.includes(ev.id);
                return (
                  <label key={ev.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/5 ${checked ? 'bg-violet-neon/10' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleEvent(ev.id)} className="accent-violet-neon w-4 h-4 flex-shrink-0" />
                    <span className="text-sm text-white/80 truncate">{ev.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className={labelCls}>Nouveau mot de passe <span className="text-white/20">(laisser vide = inchangé)</span></label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 caractères"
                autoComplete="new-password"
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer — fixe */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isLoading} disabled={selectedEventIds.length === 0} className="flex-1">
            Enregistrer
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminBackoffice() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('dashboard');
  const [dashPeriod, setDashPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  // Onglet retraits
  const [orgSearch,    setOrgSearch]    = useState('');
  const [expandedOrg,  setExpandedOrg]  = useState<string | null>(null);
  const [journalPage,  setJournalPage]  = useState(1);

  // Actions en masse — Users
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [expandedUserId,  setExpandedUserId]  = useState<string | null>(null);

  // Actions en masse — Remboursements commandes
  const [selectedRefundIds, setSelectedRefundIds] = useState<Set<string>>(new Set());

  // Actions en masse — Remboursements billets
  const [selectedTicketRefundIds, setSelectedTicketRefundIds] = useState<Set<string>>(new Set());

  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
  const [revisionTarget, setRevisionTarget] = useState<{ id: string; title: string } | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [scannerForm, setScannerForm] = useState({ firstName: '', lastName: '', phone: '', password: '', confirmPassword: '', eventIds: [] as string[] });
  const [showScannerForm, setShowScannerForm] = useState(false);
  const [showScannerPassword, setShowScannerPassword] = useState(false);
  const [showScannerConfirmPassword, setShowScannerConfirmPassword] = useState(false);
  const [createdScannerCreds, setCreatedScannerCreds] = useState<{ phone: string; password: string } | null>(null);
  const [editingScanner, setEditingScanner] = useState<ScannerRow | null>(null);
  const [editingCommission, setEditingCommission] = useState<{ id: string; value: string } | null>(null);
  const [reportEventId, setReportEventId] = useState<string | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<{ id: string; title: string } | null>(null);
  const qc = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useQuery(
    ['admin-dashboard', dashPeriod],
    async () => {
      const { data } = await api.get(`/admin/dashboard?period=${dashPeriod}`);
      return data.data;
    },
    { enabled: tab === 'dashboard', staleTime: 60_000 }
  );

  const { data: eventsData, isLoading: eventsLoading } = useQuery('admin-events', async () => {
    const { data } = await api.get('/admin/events?status=PENDING_REVIEW');
    return data.data;
  }, { enabled: tab === 'events' });

  const { data: approvedEventsData, isLoading: approvedEventsLoading } = useQuery('admin-events-approved', async () => {
    const { data } = await api.get('/admin/events?status=APPROVED');
    return data.data;
  }, { enabled: tab === 'events', staleTime: 0 });

  const { data: pendingChangesData, isLoading: pendingChangesLoading } = useQuery('admin-events-pending-changes', async () => {
    const { data } = await api.get('/admin/events?pendingStatus=PENDING');
    return data.data;
  }, { enabled: tab === 'events', staleTime: 0 });

  const { data: completedEventsData, isLoading: completedEventsLoading } = useQuery('admin-events-completed', async () => {
    const { data } = await api.get('/admin/events?status=COMPLETED&limit=50');
    return data.data;
  }, { enabled: tab === 'events', staleTime: 0 });

  const approveEventChanges = useMutation(
    async (eventId: string) => { await api.patch(`/admin/events/${eventId}/approve-changes`); },
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-events-pending-changes');
        qc.invalidateQueries('admin-dashboard'); qc.invalidateQueries('admin-counts');
        toast.success('Modifications approuvées et appliquées');
      },
      onError: () => { toast.error('Erreur lors de l\'approbation'); },
    }
  );

  const rejectEventChanges = useMutation(
    async ({ eventId, adminNote }: { eventId: string; adminNote?: string }) => {
      await api.patch(`/admin/events/${eventId}/reject-changes`, { adminNote });
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-events-pending-changes');
        qc.invalidateQueries('admin-counts');
        toast.success('Modifications refusées');
      },
      onError: () => { toast.error('Erreur lors du refus'); },
    }
  );

  const [rejectChangesTarget, setRejectChangesTarget] = useState<{ id: string; title: string } | null>(null);
  const [previewEvent, setPreviewEvent] = useState<PreviewEventData | null>(null);

  const { data: payoutsData, isLoading: payoutsLoading, refetch: refetchPayouts } = useQuery(
    'admin-payouts',
    async () => {
      const { data } = await api.get('/admin/payouts');
      return data.data as AdminPayoutOrganizer[];
    },
    { enabled: tab === 'retraits', staleTime: 0 }
  );

  const updateOrgTier = useMutation(
    async ({ organizerId, ...flags }: { organizerId: string; isApproved?: boolean; isCertified?: boolean; isPremium?: boolean }) => {
      const { data } = await api.patch(`/admin/organizers/${organizerId}/tier`, flags);
      return data;
    },
    {
      onSuccess: (data) => {
        refetchPayouts();
        toast.success(data.message ?? 'Tier mis à jour');
      },
      onError: () => { toast.error('Erreur lors de la mise à jour du tier'); },
    }
  );

  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['admin-users', userRoleFilter],
    async () => {
      const { data } = await api.get(`/admin/users${userRoleFilter ? `?role=${userRoleFilter}` : ''}`);
      return data.data;
    },
    { enabled: tab === 'users' }
  );

  const updateStatus = useMutation(
    async ({ id, status, reason, adminNote }: { id: string; status: string; reason?: string; adminNote?: string }) => {
      await api.patch(`/admin/events/${id}/status`, { status, rejectionReason: reason, adminNote });
    },
    {
      onSuccess: () => { qc.invalidateQueries('admin-events'); qc.invalidateQueries('admin-events-completed'); qc.invalidateQueries('admin-dashboard'); qc.invalidateQueries('admin-counts'); toast.success('Statut mis à jour'); },
      onError: () => { toast.error('Erreur lors de la mise à jour'); },
    }
  );

  const toggleUser = useMutation(
    async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/admin/users/${id}`, { isActive });
    },
    {
      onSuccess: () => { qc.invalidateQueries(['admin-users', userRoleFilter]); toast.success('Utilisateur mis à jour'); },
      onError: () => { toast.error('Erreur'); },
    }
  );

  const approveOrganizer = useMutation(
    async ({ organizerId, isApproved, skipKycCheck }: { organizerId: string; isApproved: boolean; skipKycCheck?: boolean }) => {
      await api.patch(`/admin/organizers/${organizerId}/approve`, { isApproved, skipKycCheck });
    },
    {
      onSuccess: () => { qc.invalidateQueries(['admin-users', userRoleFilter]); qc.invalidateQueries('admin-payouts'); toast.success('Statut organisateur mis à jour'); },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg || 'Erreur lors de la mise à jour');
      },
    }
  );

  const certifyOrganizer = useMutation(
    async ({ organizerId, isCertified }: { organizerId: string; isCertified: boolean }) => {
      await api.patch(`/admin/organizers/${organizerId}/certify`, { isCertified });
    },
    {
      onSuccess: (_, { isCertified }) => { qc.invalidateQueries(['admin-users', userRoleFilter]); toast.success(isCertified ? 'Organisateur certifié' : 'Certification retirée'); },
      onError: () => { toast.error('Erreur'); },
    }
  );

  const certifyEvent = useMutation(
    async ({ eventId, isCertified }: { eventId: string; isCertified: boolean }) => {
      await api.patch(`/admin/events/${eventId}/certify`, { isCertified });
    },
    {
      onSuccess: (_, { isCertified }) => { qc.invalidateQueries('admin-events'); toast.success(isCertified ? 'Événement certifié' : 'Certification retirée'); },
      onError: () => { toast.error('Erreur'); },
    }
  );

  const { data: vitrineData, isLoading: vitrineLoading } = useQuery('admin-vitrine', async () => {
    const { data } = await api.get('/admin/events?status=PUBLISHED&limit=50');
    return data.data;
  }, { enabled: tab === 'vitrine' });

  const updateFlags = useMutation(
    async ({ id, isFeatured, isHot, promoEnabled }: { id: string; isFeatured?: boolean; isHot?: boolean; promoEnabled?: boolean }) => {
      await api.patch(`/admin/events/${id}/flags`, { isFeatured, isHot, promoEnabled });
    },
    {
      onSuccess: () => { qc.invalidateQueries('admin-vitrine'); toast.success('Mise en avant mise à jour'); },
      onError: () => { toast.error('Erreur'); },
    }
  );

  const cancelEvent = useMutation(
    async (id: string) => {
      await api.patch(`/admin/events/${id}/status`, { status: 'CANCELLED' });
    },
    {
      onSuccess: () => { qc.invalidateQueries('admin-vitrine'); qc.invalidateQueries('admin-dashboard'); qc.invalidateQueries('admin-counts'); toast.success('Événement retiré de la vitrine'); },
      onError: () => { toast.error('Erreur'); },
    }
  );

  const { data: scannersData, isLoading: scannersLoading } = useQuery('admin-scanners', async () => {
    const { data } = await api.get('/admin/scanners');
    return data.data as ScannerRow[];
  });

  const { data: publishedEventsData } = useQuery('admin-published-events', async () => {
    const { data } = await api.get('/admin/events?limit=200');
    return data.data?.events ?? [];
  });

  const updateScannerMutation = useMutation(
    async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      await api.patch(`/admin/scanners/${id}`, payload);
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-scanners');
        setEditingScanner(null);
        toast.success('Scanner mis à jour');
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg || 'Erreur');
      },
    }
  );

  const toggleScannerMutation = useMutation(
    async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/admin/scanners/${id}`, { isActive });
    },
    {
      onSuccess: () => { qc.invalidateQueries('admin-scanners'); toast.success('Statut mis à jour'); },
      onError: () => { toast.error('Erreur'); },
    }
  );

  const createScanner = useMutation(
    async (payload: typeof scannerForm) => {
      const { confirmPassword: _cp, ...body } = payload;
      const { data } = await api.post('/admin/scanners/create-account', { ...body, eventIds: body.eventIds });
      return data.data;
    },
    {
      onSuccess: (result) => {
        qc.invalidateQueries('admin-scanners');
        if (result.isNew) {
          setCreatedScannerCreds({ phone: scannerForm.phone, password: scannerForm.password });
        } else {
          toast.success('Scanner assigné à l\'événement');
        }
        setScannerForm({ firstName: '', lastName: '', phone: '', password: '', confirmPassword: '', eventIds: [] });
        setShowScannerForm(false);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg || 'Erreur lors de la création');
      },
    }
  );

  const { data: refundsData, isLoading: refundsLoading } = useQuery(
    'admin-refunds',
    () => api.get('/admin/refunds').then((r) => r.data.data),
    { enabled: tab === 'refunds', staleTime: 0 }
  );

  const { data: ticketRefundsData, isLoading: ticketRefundsLoading } = useQuery(
    'admin-ticket-refunds',
    () => api.get('/admin/ticket-refunds').then((r) => r.data.data),
    { enabled: tab === 'refunds', staleTime: 0 }
  );

  const processTicketRefundMutation = useMutation(
    ({ ticketId, action, adminNote }: { ticketId: string; action: 'approve' | 'reject'; adminNote?: string }) =>
      api.patch(`/admin/ticket-refunds/${ticketId}`, { action, adminNote }).then((r) => r.data),
    {
      onSuccess: (_d, vars) => {
        toast.success(vars.action === 'approve' ? 'Remboursement approuvé' : 'Demande rejetée');
        qc.invalidateQueries('admin-ticket-refunds');
      },
      onError: () => { toast.error('Erreur lors du traitement'); },
    }
  );

  const [auditPage, setAuditPage] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('');
  const { data: auditData, isLoading: auditLoading } = useQuery(
    ['admin-audit', auditPage, auditActionFilter, auditEntityFilter],
    () => {
      const params = new URLSearchParams({ page: String(auditPage), limit: '50' });
      if (auditActionFilter) params.set('action', auditActionFilter);
      if (auditEntityFilter) params.set('entity', auditEntityFilter);
      return api.get(`/admin/audit-logs?${params.toString()}`).then((r) => r.data.data as { logs: AuditLogEntry[]; total: number });
    },
    { enabled: tab === 'audit', staleTime: 0, keepPreviousData: true }
  );

  const { data: platformConfig, isLoading: configLoading } = useQuery(
    'admin-platform-config',
    () => api.get('/admin/settings').then((r) => r.data.data as {
      freeTicketFee: number; updatedAt: string;
      airtelPayinRate?: number; moovPayinRate?: number;
      airtelPayoutRate?: number; moovPayoutRate?: number;
    }),
    { enabled: tab === 'settings', staleTime: 0 }
  );
  const [freeTicketFeeInput, setFreeTicketFeeInput] = useState('');
  const [rateInputs, setRateInputs] = useState({ airtelPayinRate: '', moovPayinRate: '', airtelPayoutRate: '', moovPayoutRate: '' });
  const [siteQrObjectUrl, setSiteQrObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== 'settings' || siteQrObjectUrl) return;
    let objectUrl: string | null = null;
    api.get(`/utils/qr?url=${encodeURIComponent('https://billetgab.com')}`, { responseType: 'blob' })
      .then(({ data }) => {
        objectUrl = URL.createObjectURL(new Blob([data], { type: 'image/png' }));
        setSiteQrObjectUrl(objectUrl);
      })
      .catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [tab, siteQrObjectUrl]);

  const updateConfigMutation = useMutation(
    (payload: Record<string, number>) => api.patch('/admin/settings', payload).then((r) => r.data),
    {
      onSuccess: () => {
        toast.success('Configuration mise à jour');
        qc.invalidateQueries('admin-platform-config');
        setFreeTicketFeeInput('');
        setRateInputs({ airtelPayinRate: '', moovPayinRate: '', airtelPayoutRate: '', moovPayoutRate: '' });
      },
      onError: (err: { response?: { data?: { message?: string } } }) => {
        toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour');
      },
    }
  );

  const anonymizeUserMutation = useMutation(
    (userId: string) => api.delete(`/admin/users/${userId}`).then((r) => r.data),
    {
      onSuccess: () => {
        toast.success('Données personnelles anonymisées');
        qc.invalidateQueries('admin-users');
      },
      onError: () => { toast.error('Erreur lors de l\'anonymisation'); },
    }
  );

  const processRefund = useMutation(
    ({ orderId, action, adminNote }: { orderId: string; action: 'approve' | 'reject'; adminNote?: string }) =>
      api.patch(`/admin/refunds/${orderId}`, { action, adminNote }).then((r) => r.data),
    {
      onSuccess: (_d, vars) => {
        toast.success(vars.action === 'approve' ? 'Remboursement approuvé' : 'Demande rejetée');
        qc.invalidateQueries('admin-refunds');
      },
      onError: () => { toast.error('Erreur lors du traitement'); },
    }
  );

  const bulkToggleUsersMutation = useMutation(
    async ({ action, ids }: { action: 'activate' | 'deactivate'; ids: string[] }) => {
      const { data } = await api.post('/admin/users/bulk', { action, ids });
      return data;
    },
    {
      onSuccess: (data) => {
        qc.invalidateQueries(['admin-users', userRoleFilter]);
        setSelectedUserIds(new Set());
        toast.success(data.message);
      },
      onError: () => { toast.error('Erreur lors de l\'action en masse'); },
    }
  );

  const bulkRefundsMutation = useMutation(
    async ({ action, ids, adminNote }: { action: 'approve' | 'reject'; ids: string[]; adminNote?: string }) => {
      const { data } = await api.post('/admin/refunds/bulk', { action, ids, adminNote });
      return data;
    },
    {
      onSuccess: (data) => {
        qc.invalidateQueries('admin-refunds');
        setSelectedRefundIds(new Set());
        toast.success(data.message);
      },
      onError: () => { toast.error('Erreur lors de l\'action en masse'); },
    }
  );

  const bulkTicketRefundsMutation = useMutation(
    async ({ action, ids, adminNote }: { action: 'approve' | 'reject'; ids: string[]; adminNote?: string }) => {
      const { data } = await api.post('/admin/ticket-refunds/bulk', { action, ids, adminNote });
      return data;
    },
    {
      onSuccess: (data) => {
        qc.invalidateQueries('admin-ticket-refunds');
        setSelectedTicketRefundIds(new Set());
        toast.success(data.message);
      },
      onError: () => { toast.error('Erreur lors de l\'action en masse'); },
    }
  );

  const updateCommissionMutation = useMutation(
    async ({ id, commissionRate }: { id: string; commissionRate: number }) => {
      await api.patch(`/admin/events/${id}/commission`, { commissionRate });
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-events-approved');
        qc.invalidateQueries('admin-events-completed');
        qc.invalidateQueries('admin-events');
        qc.invalidateQueries('admin-vitrine');
        setEditingCommission(null);
        toast.success('Taux de commission mis à jour');
      },
      onError: () => { toast.error('Erreur lors de la mise à jour du taux'); },
    }
  );

  const deleteEventMutation = useMutation(
    async (id: string) => { await api.delete(`/admin/events/${id}`); },
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-events-completed');
        qc.invalidateQueries('admin-events');
        setDeleteEventTarget(null);
        toast.success('Événement supprimé');
      },
      onError: () => { toast.error('Erreur lors de la suppression'); },
    }
  );

  const { data: influencerPayoutsData, isLoading: influencerPayoutsLoading } = useQuery(
    'admin-influencer-payouts',
    () => api.get('/influencer/admin/payouts').then((r) => r.data.data as Array<{
      id: string;
      amount: string;
      operator: string;
      phoneNumber: string;
      status: string;
      adminNote: string | null;
      createdAt: string;
      influencer: { id: string; firstName: string; lastName: string; email: string };
    }>),
    { enabled: tab === 'influenceurs', staleTime: 0 }
  );

  const updateInfluencerPayoutMutation = useMutation(
    ({ payoutId, status, adminNote }: { payoutId: string; status: 'PAID' | 'REJECTED'; adminNote?: string }) =>
      api.patch(`/influencer/admin/payouts/${payoutId}`, { status, adminNote }).then((r) => r.data),
    {
      onSuccess: (_d, vars) => {
        toast.success(vars.status === 'PAID' ? 'Versement marqué comme payé' : 'Demande rejetée');
        qc.invalidateQueries('admin-influencer-payouts');
      },
      onError: () => { toast.error('Erreur lors du traitement'); },
    }
  );

  const { data: adminCounts } = useQuery(
    'admin-counts',
    () => api.get('/admin/counts').then((r) => r.data.data as { pendingEvents: number; pendingChanges: number; pendingPayouts: number; pendingRefunds: number }),
    { refetchInterval: 30_000, staleTime: 0 }
  );

  const TABS = [
    { key: 'dashboard' as TabType, label: 'Dashboard', Icon: LayoutDashboard },
    { key: 'events' as TabType, label: 'Validation', Icon: ListChecks, badge: (adminCounts?.pendingEvents ?? 0) + (adminCounts?.pendingChanges ?? 0) || undefined },
    { key: 'vitrine' as TabType, label: 'Vitrine', Icon: Sparkles },
    { key: 'scanners' as TabType, label: 'Scanners', Icon: ScanLine },
    { key: 'users' as TabType, label: 'Utilisateurs', Icon: Users },
    { key: 'retraits' as TabType, label: 'Retraits', Icon: Banknote, badge: adminCounts?.pendingPayouts || undefined },
    { key: 'refunds' as TabType, label: 'Remboursements', Icon: RotateCcw, badge: adminCounts?.pendingRefunds || undefined },
    { key: 'influenceurs' as TabType, label: 'Influenceurs', Icon: Ticket },
    { key: 'audit' as TabType, label: 'Audit', Icon: ScrollText },
    { key: 'settings' as TabType, label: 'Paramètres', Icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h1 className="font-bebas text-3xl sm:text-5xl tracking-wider text-gradient leading-none">BACK-OFFICE ADMIN</h1>
            <p className="text-white/40 text-xs mt-1">{user?.firstName} {user?.lastName}</p>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-rose-neon hover:border-rose-neon/30 transition-colors text-sm flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
        <p className="text-white/40 mt-1 text-sm hidden sm:block">Gestion de la plateforme BilletGab</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 border-b border-violet-neon/20 pb-3 sm:pb-4 overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label, Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            title={label}
            className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              tab === key ? 'bg-neon-gradient text-white shadow-neon' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            {(badge ?? 0) > 0 && (
              <span className="min-w-4 h-4 sm:min-w-5 sm:h-5 px-1 bg-rose-neon rounded-full text-[10px] sm:text-xs flex items-center justify-center text-white font-bold">
                {(badge ?? 0) > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Dashboard tab ── */}
      {tab === 'dashboard' && (
        <div className="space-y-6">

          {/* Sélecteur de période */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-bebas text-2xl tracking-wider text-white/80 leading-none">Vue d'ensemble</h2>
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/[0.06]">
              {([
                { key: 'week',  label: '7 J'  },
                { key: 'month', label: '30 J' },
                { key: 'year',  label: '1 AN' },
                { key: 'all',   label: 'TOUT' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDashPeriod(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                    dashPeriod === key
                      ? 'bg-violet-neon/20 text-violet-neon border border-violet-neon/30'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dashLoading ? (
            <div className="space-y-6">
              <SkeletonKpiGrid count={3} />
              <div className="glass-card h-56 animate-pulse border border-white/[0.06]" />
              <SkeletonKpiGrid count={4} />
            </div>
          ) : (
            <>
              {/* KPIs période */}
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3">
                  {dashPeriod === 'week' ? '7 derniers jours' : dashPeriod === 'month' ? '30 derniers jours' : dashPeriod === 'year' ? 'Depuis le 1er janvier' : 'Depuis le début'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KpiCard title="Volume de transactions" value={formatPrice(dashboard?.periodVolume ?? 0, 'FCFA', '0 FCFA')} subtitle="Total brut encaissé" Icon={TrendingUp} color="cyan" />
                  <KpiCard title="Revenus plateforme" value={formatPrice(dashboard?.periodRevenue ?? 0, 'FCFA', '0 FCFA')} subtitle="Commission BilletGab" Icon={Banknote} color="violet" />
                  <KpiCard title="Commandes" value={(dashboard?.periodOrders ?? 0).toLocaleString('fr-FR')} subtitle="Paiements confirmés" Icon={ShoppingCart} color="green" />
                </div>
              </div>

              {/* Graphe */}
              {(dashboard?.chartData?.length ?? 0) > 0 && (() => {
                const maxVol = Math.max(...(dashboard!.chartData.map((d: { volume: number }) => d.volume)), 1);
                const formatK = (v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}k` : String(v);
                const fmtDate = (str: string) => {
                  const d = new Date(str);
                  return dashPeriod === 'year'
                    ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                };
                return (
                  <div className="glass-card border border-white/[0.06] p-5">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Évolution sur la période</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={dashboard!.chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#00FFFF" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#9B5CF6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#9B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={fmtDate}
                          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickFormatter={formatK}
                          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={44}
                          domain={[0, maxVol * 1.1]}
                        />
                        <Tooltip
                          contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                          labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
                          labelFormatter={fmtDate}
                          formatter={(value: number, name: string) => [
                            formatPrice(value, 'FCFA'),
                            name === 'volume' ? 'Volume' : 'Revenus',
                          ]}
                        />
                        <Legend
                          formatter={(value) => value === 'volume' ? 'Volume transactions' : 'Revenus plateforme'}
                          wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 8 }}
                        />
                        <Area type="monotone" dataKey="volume"  stroke="#00FFFF" strokeWidth={1.5} fill="url(#gradVol)" dot={false} activeDot={{ r: 4, fill: '#00FFFF' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#9B5CF6" strokeWidth={1.5} fill="url(#gradRev)" dot={false} activeDot={{ r: 4, fill: '#9B5CF6' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* KPIs globaux (toujours all-time) */}
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Totaux globaux</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <KpiCard title="Acheteurs" value={(dashboard?.buyerCount ?? 0).toLocaleString('fr-FR')} subtitle="Comptes enregistrés" Icon={UserCheck} color="green" />
                  <KpiCard title="Organisateurs" value={(dashboard?.totalOrganizers ?? 0).toLocaleString('fr-FR')} subtitle="Comptes actifs" Icon={ShieldAlert} color="cyan" />
                  <KpiCard title="Événements actifs" value={(dashboard?.totalEvents ?? 0).toLocaleString('fr-FR')} subtitle="Publiés en ce moment" Icon={CalendarDays} color="violet" />
                  <KpiCard title="En attente" value={(dashboard?.pendingEvents ?? 0).toLocaleString('fr-FR')} subtitle="Validation requise" Icon={Clock} color="rose" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <KpiCard title="Total likes" value={(dashboard?.totalLikes ?? 0).toLocaleString('fr-FR')} subtitle="Likes sur tous les événements" Icon={Heart} color="rose" />
                  <KpiCard title="Abonnés organisateurs" value={(dashboard?.totalFollows ?? 0).toLocaleString('fr-FR')} subtitle="Follows sur la plateforme" Icon={Users} color="violet" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Events validation tab ── */}
      {tab === 'events' && (
        <div className="space-y-8">

          {/* ── File d'attente : APPROVED (publication programmée) ── */}
          <div>
            <h2 className="font-bebas text-xl tracking-wider text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-neon" />
              Publication programmée
              {(approvedEventsData?.events?.length ?? 0) > 0 && (
                <span className="min-w-5 h-5 px-1 bg-cyan-neon/20 text-cyan-neon rounded-full text-xs flex items-center justify-center font-bold border border-cyan-neon/30">
                  {approvedEventsData.events.length}
                </span>
              )}
            </h2>
            {approvedEventsLoading ? (
              <SkeletonCard lines={3} />
            ) : !approvedEventsData?.events?.length ? (
              <div className="glass-card p-8 text-center border border-white/5">
                <p className="text-white/30 text-sm">Aucun événement approuvé en attente de publication</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvedEventsData.events.map((event: Record<string, unknown>) => (
                  <motion.div
                    key={event.id as string}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center border border-cyan-neon/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bebas text-lg tracking-wide text-white">{event.title as string}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-neon/20 text-cyan-neon font-semibold border border-cyan-neon/30">APPROUVÉ</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatEventDate(event.eventDate as string)}</span>
                        {(event.scheduledPublishAt as string) && (
                          <span className="flex items-center gap-1 text-cyan-neon">
                            <Clock className="w-3 h-3" />
                            Publication le {new Date(event.scheduledPublishAt as string).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {editingCommission?.id === event.id ? (
                          <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-white/50">Commission :</span>
                            <input
                              type="number" min="0" max="50" step="0.5"
                              value={editingCommission!.value}
                              onChange={(e) => setEditingCommission({ id: event.id as string, value: e.target.value })}
                              className="w-16 text-xs px-1.5 py-0.5 rounded bg-white/10 border border-violet-neon/40 text-white text-center focus:outline-none focus:border-violet-neon"
                              autoFocus
                            />
                            <span className="text-white/40">%</span>
                            <button onClick={() => updateCommissionMutation.mutate({ id: event.id as string, commissionRate: Number(editingCommission!.value) / 100 })} disabled={updateCommissionMutation.isLoading} className="text-xs px-2 py-0.5 rounded bg-violet-neon/20 text-violet-neon hover:bg-violet-neon/30 transition-colors disabled:opacity-40">OK</button>
                            <button onClick={() => setEditingCommission(null)} className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors">✕</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setEditingCommission({ id: event.id as string, value: String(Math.round(Number(event.commissionRate) * 100)) })}
                            className="flex items-center gap-1 hover:text-white transition-colors group"
                            title="Modifier le taux de commission"
                          >
                            <span className="font-mono">{Math.round(Number(event.commissionRate) * 100)}% commission</span>
                            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-violet-neon" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: event.id as string, status: 'PUBLISHED' })}
                        isLoading={updateStatus.isLoading}
                      >
                        <CheckCircle className="w-4 h-4" /> Publier maintenant
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setRejectTarget({ id: event.id as string, title: event.title as string })}
                      >
                        <XCircle className="w-4 h-4" /> Annuler
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ── En attente de validation : PENDING_REVIEW ── */}
          <div>
            <h2 className="font-bebas text-xl tracking-wider text-white mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-yellow-400" />
              En attente de validation
              {(eventsData?.events?.length ?? 0) > 0 && (
                <span className="min-w-5 h-5 px-1 bg-yellow-400/20 text-yellow-400 rounded-full text-xs flex items-center justify-center font-bold border border-yellow-400/30">
                  {eventsData.events.length}
                </span>
              )}
            </h2>
            {eventsLoading ? (
              <div className="space-y-4">
                {[1,2,3].map((i) => <SkeletonCard key={i} lines={4} />)}
              </div>
            ) : !eventsData?.events?.length ? (
              <div className="glass-card p-16 text-center">
                <CheckCircle className="w-12 h-12 text-green-400/40 mx-auto mb-3" />
                <p className="text-white/40">Aucun événement en attente de validation</p>
              </div>
            ) : (
              <div className="space-y-4">
          {eventsData.events.map((event: Record<string, unknown>) => {
            const org = event.organizer as Record<string, unknown>;
            const orgUser = (org?.user as Record<string, unknown>) ?? {};
            return (
              <motion.div
                key={event.id as string}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 flex flex-col md:flex-row gap-4 border border-yellow-500/10"
              >
                {(event.coverImageUrl as string) ? (
                  <img src={event.coverImageUrl as string} alt="" className="w-full md:w-32 h-24 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div
                    className="w-full md:w-32 h-24 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }}
                  >
                    <span className="text-white/20 text-xs text-center px-2">Pas d'affiche</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bebas text-xl tracking-wide text-white">{event.title as string}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold">EN RÉVISION</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">{event.category as string}</span>
                  </div>
                  <p className="text-sm text-white/50 line-clamp-2 mb-2">{event.description as string}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-white/40 mb-3">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatEventDate(event.eventDate as string)}
                    </span>
                    {(event.scheduledPublishAt as string) && (
                      <span className="flex items-center gap-1 text-cyan-neon">
                        <Clock className="w-3 h-3" />
                        Publication programmée : {new Date(event.scheduledPublishAt as string).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <span>Par : <span className="text-white/60">{orgUser.firstName as string} {orgUser.lastName as string}</span></span>
                    <span className="text-violet-neon">{orgUser.email as string}</span>
                    {Boolean(event.offer) && (
                      <span className="flex items-center gap-1">
                        Forfait :
                        <span className={`font-semibold ${event.offer === 'PREMIUM' ? 'text-rose-neon' : event.offer === 'INTERMEDIAIRE' ? 'text-yellow-400' : 'text-cyan-neon'}`}>
                          {event.offer as string}
                        </span>
                      </span>
                    )}
                    {editingCommission?.id === event.id ? (
                      <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-white/50">Commission :</span>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          value={editingCommission!.value}
                          onChange={(e) => setEditingCommission({ id: event.id as string, value: e.target.value })}
                          className="w-16 text-xs px-1.5 py-0.5 rounded bg-white/10 border border-violet-neon/40 text-white text-center focus:outline-none focus:border-violet-neon"
                          autoFocus
                        />
                        <span className="text-white/40 text-xs">%</span>
                        <button
                          onClick={() => updateCommissionMutation.mutate({ id: event.id as string, commissionRate: Number(editingCommission!.value) / 100 })}
                          disabled={updateCommissionMutation.isLoading}
                          className="text-xs px-2 py-0.5 rounded bg-violet-neon/20 text-violet-neon hover:bg-violet-neon/30 transition-colors disabled:opacity-40"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingCommission(null)}
                          className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCommission({ id: event.id as string, value: String(Math.round(Number(event.commissionRate) * 100)) }); }}
                        className="flex items-center gap-1 text-white/60 font-mono hover:text-white transition-colors group"
                        title="Modifier le taux de commission"
                      >
                        ({Math.round(Number(event.commissionRate) * 100)}% commission)
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-violet-neon" />
                      </button>
                    )}
                  </div>
                  {/* Catégories de billets */}
                  {Array.isArray(event.ticketCategories) && (event.ticketCategories as Array<{name:string;price:number;quantityTotal:number}>).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(event.ticketCategories as Array<{name:string;price:number;quantityTotal:number}>).map((cat, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-violet-neon/10 text-violet-neon border border-violet-neon/20">
                          {cat.name} · {formatPrice(cat.price)} · {cat.quantityTotal} places
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap md:flex-col gap-2 flex-shrink-0 mt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1.5 border-violet-neon/30 text-violet-neon hover:bg-violet-neon/10"
                    onClick={() => setPreviewEvent(event as PreviewEventData)}
                  >
                    <Eye className="w-4 h-4" /> Prévisualiser
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={() => updateStatus.mutate({ id: event.id as string, status: 'APPROVED' })}
                    isLoading={updateStatus.isLoading}
                  >
                    <CheckCircle className="w-4 h-4" /> Approuver
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1.5 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
                    onClick={() => setRevisionTarget({ id: event.id as string, title: event.title as string })}
                  >
                    <MessageSquare className="w-4 h-4" /> Révision
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={() => setRejectTarget({ id: event.id as string, title: event.title as string })}
                  >
                    <XCircle className="w-4 h-4" /> Refuser
                  </Button>
                </div>
              </motion.div>
            );
          })}
              </div>
            )}
          </div>

          {/* ── Modifications en attente ── */}
          <div>
            <h2 className="font-bebas text-xl tracking-wider text-white mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-violet-neon" />
              Modifications en attente
              {(pendingChangesData?.events?.length ?? 0) > 0 && (
                <span className="min-w-5 h-5 px-1 bg-violet-neon/20 text-violet-neon rounded-full text-xs flex items-center justify-center font-bold border border-violet-neon/30">
                  {pendingChangesData.events.length}
                </span>
              )}
            </h2>
            {pendingChangesLoading ? (
              <div className="space-y-4">{[1,2].map((i) => <SkeletonCard key={i} lines={4} />)}</div>
            ) : !pendingChangesData?.events?.length ? (
              <div className="glass-card p-10 text-center">
                <CheckCircle className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Aucune modification en attente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingChangesData.events.map((event: Record<string, unknown>) => {
                  const pending = event.pendingChanges as Record<string, unknown> | null;
                  const org = event.organizer as Record<string, unknown>;
                  const orgUser = (org?.user as Record<string, unknown>) ?? {};
                  const cats = event.ticketCategories as Array<{id:string;name:string;price:number;quantityTotal:number;quantitySold:number}>;

                  // Champs qui ont changé
                  const LABELS: Record<string, string> = {
                    title: 'Titre', subtitle: 'Sous-titre', description: 'Description',
                    category: 'Catégorie', eventDate: 'Date', doorsOpenAt: 'Ouverture',
                    endDate: 'Fin', venueName: 'Lieu', venueAddress: 'Adresse',
                    venueCity: 'Ville', maxTicketsPerOrder: 'Max billets/commande',
                    coverImageUrl: 'Affiche',
                  };
                  const changes = pending ? Object.entries(pending).filter(([k]) => k !== 'ticketCategories') : [];

                  return (
                    <motion.div
                      key={event.id as string}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-5 border border-violet-neon/20"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="font-bebas text-xl tracking-wide text-white">{event.title as string}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-neon/20 text-violet-neon font-semibold border border-violet-neon/30">
                          MODIFICATIONS EN ATTENTE
                        </span>
                        <span className="text-xs text-white/40">
                          Par {orgUser.firstName as string} {orgUser.lastName as string} · {orgUser.email as string}
                        </span>
                      </div>

                      {/* Diff des champs modifiés */}
                      {changes.length > 0 && (
                        <div className="mb-3 space-y-1.5">
                          <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Modifications proposées</p>
                          {changes.map(([key, newVal]) => {
                            const oldVal = event[key];
                            const label = LABELS[key] || key;
                            const fmt = (v: unknown) => {
                              if (v === null || v === undefined || v === '') return <span className="text-white/20 italic">vide</span>;
                              if (key.toLowerCase().includes('date')) return new Date(v as string).toLocaleString('fr-FR');
                              return String(v);
                            };
                            return (
                              <div key={key} className="flex items-start gap-2 text-xs">
                                <span className="text-white/40 w-28 flex-shrink-0">{label}</span>
                                <span className="text-rose-neon/70 line-through">{fmt(oldVal)}</span>
                                <span className="text-white/20">→</span>
                                <span className="text-green-400">{fmt(newVal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Catégories modifiées */}
                      {Array.isArray(pending?.ticketCategories) && (
                        <div className="mb-3">
                          <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Catégories proposées</p>
                          <div className="flex flex-wrap gap-2">
                            {(pending!.ticketCategories as Array<{id?:string;name:string;price:number;quantityTotal:number}>).map((cat, i) => {
                              const existing = cats?.find(c => c.id === cat.id);
                              return (
                                <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border ${existing ? 'bg-yellow-400/5 border-yellow-400/20 text-yellow-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                  {cat.name} · {formatPrice(cat.price)} · {cat.quantityTotal} places
                                  {existing ? ' (modif.)' : ' (nouveau)'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1.5 border-violet-neon/30 text-violet-neon hover:bg-violet-neon/10"
                          onClick={() => {
                            const merged = {
                              ...event,
                              ...(pending ?? {}),
                              ticketCategories: Array.isArray(pending?.ticketCategories)
                                ? pending!.ticketCategories
                                : event.ticketCategories,
                            };
                            setPreviewEvent(merged as PreviewEventData);
                          }}
                        >
                          <Eye className="w-4 h-4" /> Prévisualiser (après modif.)
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex items-center gap-1.5"
                          onClick={() => approveEventChanges.mutate(event.id as string)}
                          isLoading={approveEventChanges.isLoading}
                        >
                          <CheckCircle className="w-4 h-4" /> Approuver les modifications
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex items-center gap-1.5"
                          onClick={() => setRejectChangesTarget({ id: event.id as string, title: event.title as string })}
                        >
                          <XCircle className="w-4 h-4" /> Refuser
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Événements terminés ── */}
          <div>
            <h2 className="font-bebas text-xl tracking-wider text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-white/30" />
              Terminés
              {(completedEventsData?.events?.length ?? 0) > 0 && (
                <span className="min-w-5 h-5 px-1 bg-white/10 text-white/50 rounded-full text-xs flex items-center justify-center font-bold border border-white/10">
                  {completedEventsData.events.length}
                </span>
              )}
            </h2>
            {completedEventsLoading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <SkeletonCard key={i} lines={3} />)}</div>
            ) : !completedEventsData?.events?.length ? (
              <div className="glass-card p-10 text-center">
                <p className="text-white/20">Aucun événement terminé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedEventsData.events.map((event: Record<string, unknown>) => {
                  const org = event.organizer as Record<string, unknown>;
                  const orgUser = (org?.user as Record<string, unknown>) ?? {};
                  const cats = (event.ticketCategories as { quantityTotal: number; quantitySold: number }[]) ?? [];
                  const totalSold = cats.reduce((s, c) => s + c.quantitySold, 0);
                  const totalQty = cats.reduce((s, c) => s + c.quantityTotal, 0);
                  return (
                    <motion.div
                      key={event.id as string}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-4 flex flex-col md:flex-row gap-4 border border-white/5 opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {(event.coverImageUrl as string) ? (
                        <img src={event.coverImageUrl as string} alt="" className="w-full md:w-20 h-16 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-full md:w-20 h-16 rounded-lg flex-shrink-0 bg-white/5 flex items-center justify-center">
                          <span className="text-white/20 text-xs">—</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bebas text-lg tracking-wide text-white/80">{event.title as string}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40">TERMINÉ</span>
                          <span className="text-xs text-white/30">{event.category as string}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-white/30">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatEventDate(event.eventDate as string)}
                          </span>
                          <span>{(orgUser.firstName as string) ?? ''} {(orgUser.lastName as string) ?? ''}</span>
                          <span>{totalSold}/{totalQty} billets vendus</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteEventTarget({ id: event.id as string, title: event.title as string })}
                        className="flex-shrink-0 text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                      >
                        Supprimer
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Vitrine tab ── */}
      {tab === 'vitrine' && (
        vitrineLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => <SkeletonCard key={i} lines={3} />)}
          </div>
        ) :
        <div className="space-y-3">
          <div className="mb-6 p-4 glass-card border border-violet-neon/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" /> À la une — apparaît en hero (1 seul à la fois)</span>
              <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-rose-neon flex-shrink-0" /> HOT — badge flamme + section Tendances</span>
              <span className="flex items-center gap-1.5"><Ban className="w-3.5 h-3.5 text-white/30 flex-shrink-0" /> Retirer — masque l'événement du site</span>
            </div>
          </div>

          {!vitrineData?.events?.length ? (
            <div className="glass-card p-16 text-center">
              <Sparkles className="w-12 h-12 text-violet-neon/30 mx-auto mb-3" />
              <p className="text-white/40">Aucun événement publié</p>
            </div>
          ) : vitrineData.events.map((ev: Record<string, unknown>) => {
            const org = ev.organizer as Record<string, unknown>;
            const isFeatured = ev.isFeatured as boolean;
            const isHot = ev.isHot as boolean;
            const isEventCertified = ev.isCertified as boolean;
            const cats = (ev.ticketCategories as Array<{ name: string; price: number; quantityTotal: number; quantitySold: number }>) ?? [];
            const totalSold = cats.reduce((s, c) => s + c.quantitySold, 0);
            const totalCap = cats.reduce((s, c) => s + c.quantityTotal, 0);
            const grossRevenue = cats.reduce((s, c) => s + Number(c.price) * c.quantitySold, 0);
            const netRevenue = Math.floor(grossRevenue / 1.025);
            const commRate = Number(ev.commissionRate ?? 0.07);
            const platformCommission = Math.round(netRevenue * commRate);
            const organizerAmt = netRevenue - platformCommission;
            const soldPct = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;
            return (

              <motion.div
                key={ev.id as string}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Cover */}
                <div className="w-full sm:w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                  {(ev.coverImageUrl as string) ? (
                    <img src={ev.coverImageUrl as string} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bebas text-lg tracking-wide text-white truncate">{ev.title as string}</h3>
                    {isFeatured && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-semibold border border-yellow-400/30">
                        <Star className="w-3 h-3" /> À la une
                      </span>
                    )}
                    {isHot && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-neon/20 text-rose-neon font-semibold border border-rose-neon/30">
                        <Flame className="w-3 h-3" /> HOT
                      </span>
                    )}
                    {isEventCertified && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-neon/10 text-cyan-neon font-semibold border border-cyan-neon/30">
                        <BadgeCheck className="w-3 h-3" /> Certifié
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                  <p className="text-white/40 text-xs">{org?.companyName as string} · {formatEventDate(ev.eventDate as string)}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReportEventId(reportEventId === (ev.id as string) ? null : (ev.id as string)); }}
                    className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-neon transition-colors flex-shrink-0"
                  >
                    <TrendingUp className="w-3 h-3" />
                    Rapport
                    <ChevronDown className={`w-3 h-3 transition-transform ${reportEventId === ev.id ? 'rotate-180' : ''}`} />
                  </button>
                  </div>
                  {editingCommission?.id === ev.id ? (
                    <span className="flex items-center gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                      <span className="text-white/50 text-xs">Commission :</span>
                      <input
                        type="number" min="0" max="50" step="0.5"
                        value={editingCommission!.value}
                        onChange={(e) => setEditingCommission({ id: ev.id as string, value: e.target.value })}
                        className="w-16 text-xs px-1.5 py-0.5 rounded bg-white/10 border border-violet-neon/40 text-white text-center focus:outline-none focus:border-violet-neon"
                        autoFocus
                      />
                      <span className="text-white/40 text-xs">%</span>
                      <button onClick={() => updateCommissionMutation.mutate({ id: ev.id as string, commissionRate: Number(editingCommission!.value) / 100 })} disabled={updateCommissionMutation.isLoading} className="text-xs px-2 py-0.5 rounded bg-violet-neon/20 text-violet-neon hover:bg-violet-neon/30 transition-colors disabled:opacity-40">OK</button>
                      <button onClick={() => setEditingCommission(null)} className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors">✕</button>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingCommission({ id: ev.id as string, value: String(Math.round(Number(ev.commissionRate) * 100)) }); }}
                      className="flex items-center gap-1 text-white/40 text-xs font-mono hover:text-white transition-colors group mt-1"
                      title="Modifier le taux de commission"
                    >
                      ({Math.round(Number(ev.commissionRate) * 100)}% commission)
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-violet-neon" />
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-shrink-0">
                  <Button
                    variant={isFeatured ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateFlags.mutate({ id: ev.id as string, isFeatured: !isFeatured })}
                    isLoading={updateFlags.isLoading}
                  >
                    <Star className="w-3.5 h-3.5" />
                    {isFeatured ? 'Retirer vedette' : 'À la une'}
                  </Button>
                  <Button
                    variant={isHot ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateFlags.mutate({ id: ev.id as string, isHot: !isHot })}
                    isLoading={updateFlags.isLoading}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    {isHot ? 'Retirer HOT' : 'HOT'}
                  </Button>
                  <Button
                    variant={isEventCertified ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => certifyEvent.mutate({ eventId: ev.id as string, isCertified: !isEventCertified })}
                    isLoading={certifyEvent.isLoading}
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {isEventCertified ? 'Retirer certif.' : 'Certifier'}
                  </Button>
                  <Button
                    variant={(ev.promoEnabled as boolean) ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateFlags.mutate({ id: ev.id as string, promoEnabled: !(ev.promoEnabled as boolean) })}
                    isLoading={updateFlags.isLoading}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {(ev.promoEnabled as boolean) ? 'Promo ON' : 'Promo OFF'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => cancelEvent.mutate(ev.id as string)}
                    isLoading={cancelEvent.isLoading}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Retirer
                  </Button>
                </div>
                </div>

                {/* ── Panneau Rapport ── */}
                {reportEventId === (ev.id as string) && (
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    {/* Progression globale */}
                    <div>
                      <div className="flex justify-between text-xs text-white/50 mb-1.5">
                        <span>Billets vendus</span>
                        <span><span className="text-white font-semibold">{totalSold}</span> / {totalCap} places — <span className="text-violet-neon font-semibold">{soldPct}%</span></span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-neon rounded-full transition-all" style={{ width: `${soldPct}%` }} />
                      </div>
                    </div>
                    {/* KPIs revenus */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-white/40 text-xs mb-1">Revenus bruts</p>
                        <p className="text-white text-sm font-bold">{formatPrice(grossRevenue)}</p>
                      </div>
                      <div className="bg-rose-neon/5 rounded-xl p-2.5 text-center border border-rose-neon/10">
                        <p className="text-white/40 text-xs mb-1">Commission ({Math.round(commRate * 100)}%)</p>
                        <p className="text-rose-neon text-sm font-bold">{formatPrice(platformCommission)}</p>
                      </div>
                      <div className="bg-cyan-neon/5 rounded-xl p-2.5 text-center border border-cyan-neon/10">
                        <p className="text-white/40 text-xs mb-1">Organisateur</p>
                        <p className="text-cyan-neon text-sm font-bold">{formatPrice(organizerAmt)}</p>
                      </div>
                    </div>
                    {/* Détail par catégorie */}
                    {cats.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-white/30 text-xs uppercase tracking-widest font-semibold">Par catégorie</p>
                        {cats.map((cat, i) => {
                          const catPct = cat.quantityTotal > 0 ? Math.round((cat.quantitySold / cat.quantityTotal) * 100) : 0;
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="text-white/70 flex-1 truncate">{cat.name}</span>
                              <span className="text-white/40 whitespace-nowrap">{cat.quantitySold} / {cat.quantityTotal}</span>
                              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden flex-shrink-0">
                                <div className="h-full bg-violet-neon/60 rounded-full" style={{ width: `${catPct}%` }} />
                              </div>
                              <span className="text-white/60 w-20 text-right flex-shrink-0">{formatPrice(Number(cat.price) * cat.quantitySold)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-white/20 text-xs">* Estimations calculées sur montant net après frais opérateur (2,5%)</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Users tab ── */}
      {tab === 'users' && (
        <div>
          {/* Role filter */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {['', 'BUYER', 'ORGANIZER', 'SCANNER', 'ADMIN'].map((r) => (
              <button
                key={r}
                onClick={() => setUserRoleFilter(r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  userRoleFilter === r
                    ? 'bg-neon-gradient text-white'
                    : 'bg-bg-card border border-violet-neon/20 text-white/50 hover:text-white'
                }`}
              >
                {r || 'Tous'}
              </button>
            ))}
          </div>

          {usersLoading ? (
            <SkeletonTable rows={6} />
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-[10px] uppercase tracking-widest">
                    <th className="px-4 py-2.5 w-9">
                      <button
                        onClick={() => {
                          const allIds = (usersData?.users ?? [])
                            .filter((u: Record<string, unknown>) => (u.role as string) !== 'ADMIN')
                            .map((u: Record<string, unknown>) => u.id as string);
                          const allSelected = allIds.every((id: string) => selectedUserIds.has(id));
                          setSelectedUserIds(allSelected ? new Set() : new Set(allIds));
                        }}
                        className="text-white/30 hover:text-violet-neon transition-colors"
                      >
                        {(usersData?.users ?? [])
                          .filter((u: Record<string, unknown>) => (u.role as string) !== 'ADMIN')
                          .every((u: Record<string, unknown>) => selectedUserIds.has(u.id as string)) && selectedUserIds.size > 0
                          ? <CheckSquare className="w-3.5 h-3.5 text-violet-neon" />
                          : <Square className="w-3.5 h-3.5" />
                        }
                      </button>
                    </th>
                    <th className="text-left px-4 py-2.5">Utilisateur</th>
                    <th className="text-center px-4 py-2.5 w-14">Statut</th>
                    <th className="px-3 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {(usersData?.users ?? []).map((u: Record<string, unknown>) => {
                    const uid = u.id as string;
                    const isExpanded = expandedUserId === uid;
                    const org = (u.role as string) === 'ORGANIZER' ? (u as Record<string, unknown>).organizer as Record<string, unknown> | null : null;
                    return (
                      <React.Fragment key={uid}>
                        <tr
                          className={`border-b border-white/5 transition-colors ${(u.role as string) !== 'ADMIN' ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                          onClick={() => { if ((u.role as string) !== 'ADMIN') setExpandedUserId(isExpanded ? null : uid); }}
                        >
                          <td className="px-4 py-3 w-9" onClick={(e) => e.stopPropagation()}>
                            {(u.role as string) !== 'ADMIN' && (
                              <button
                                onClick={() => {
                                  setSelectedUserIds((prev) => {
                                    const next = new Set(prev);
                                    next.has(uid) ? next.delete(uid) : next.add(uid);
                                    return next;
                                  });
                                }}
                                className="text-white/30 hover:text-violet-neon transition-colors"
                              >
                                {selectedUserIds.has(uid)
                                  ? <CheckSquare className="w-3.5 h-3.5 text-violet-neon" />
                                  : <Square className="w-3.5 h-3.5" />
                                }
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium">{u.firstName as string} {u.lastName as string}</span>
                              <RoleBadge role={u.role as string} />
                            </div>
                            <p className="text-white/35 text-xs mt-0.5">{(u.email as string) || (u.phone as string)}</p>
                            {org && <p className="text-violet-neon/60 text-[11px] mt-0.5">{org.companyName as string}</p>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.isActive
                              ? <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                              : <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                            }
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(u.role as string) !== 'ADMIN' && (
                              <ChevronDown className={`w-4 h-4 text-white/35 transition-transform duration-200 inline-block ${isExpanded ? 'rotate-180' : ''}`} />
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-white/5 bg-white/[0.015]">
                            <td colSpan={4} className="px-5 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  variant={u.isActive ? 'danger' : 'secondary'}
                                  size="sm"
                                  onClick={() => toggleUser.mutate({ id: uid, isActive: !u.isActive })}
                                  isLoading={toggleUser.isLoading}
                                >
                                  {u.isActive ? 'Bloquer' : 'Activer'}
                                </Button>
                                {org && (
                                  <>
                                    {org.kycDocumentUrl ? (
                                      <a
                                        href={/\.(jpg|jpeg|png|webp)$/i.test(org.kycDocumentUrl as string) || (org.kycDocumentUrl as string).includes('/image/upload/')
                                          ? (org.kycDocumentUrl as string)
                                          : `https://docs.google.com/viewer?url=${encodeURIComponent(org.kycDocumentUrl as string)}&embedded=true`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-neon/10 text-violet-neon text-xs font-semibold border border-violet-neon/20 hover:bg-violet-neon/20 transition-colors"
                                      >
                                        <FileSearch className="w-3.5 h-3.5" />
                                        KYC
                                      </a>
                                    ) : (
                                      <span className="text-xs text-white/25 italic">Pas de KYC</span>
                                    )}
                                    <Button
                                      variant={org.isApproved ? 'danger' : 'primary'}
                                      size="sm"
                                      onClick={() => approveOrganizer.mutate({ organizerId: org.id as string, isApproved: !org.isApproved, skipKycCheck: true })}
                                      isLoading={approveOrganizer.isLoading}
                                    >
                                      {org.isApproved ? 'Désapprouver' : 'Approuver'}
                                    </Button>
                                    <Button
                                      variant={org.isCertified ? 'danger' : 'secondary'}
                                      size="sm"
                                      onClick={() => certifyOrganizer.mutate({ organizerId: org.id as string, isCertified: !org.isCertified })}
                                      isLoading={certifyOrganizer.isLoading}
                                    >
                                      {org.isCertified ? 'Retirer certif.' : 'Certifier'}
                                    </Button>
                                  </>
                                )}
                                {(u.firstName as string) !== 'Compte' && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Anonymiser ${u.firstName} ${u.lastName} ? Cette action est irréversible.`)) {
                                        anonymizeUserMutation.mutate(uid);
                                      }
                                    }}
                                    className="text-xs text-white/25 hover:text-rose-neon transition-colors ml-1"
                                  >
                                    Anonymiser (RGPD)
                                  </button>
                                )}
                                <span className="ml-auto text-[11px] text-white/25 font-mono">
                                  {(u.phone as string) || '—'} · {new Date(u.createdAt as string).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              </div>
              <div className="px-4 py-2.5 border-t border-white/5 text-xs text-white/30">
                {usersData?.total ?? 0} utilisateur{(usersData?.total ?? 0) > 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Barre d'actions en masse */}
          {selectedUserIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 sm:gap-3 glass-card px-4 sm:px-5 py-3 border border-violet-neon/30 shadow-neon rounded-2xl max-w-[calc(100vw-2rem)]">
              <span className="text-sm text-white/60 font-semibold whitespace-nowrap">
                {selectedUserIds.size} sélectionné{selectedUserIds.size > 1 ? 's' : ''}
              </span>
              <div className="w-px h-5 bg-white/10" />
              <button
                onClick={() => bulkToggleUsersMutation.mutate({ action: 'activate', ids: Array.from(selectedUserIds) })}
                disabled={bulkToggleUsersMutation.isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Activer ({selectedUserIds.size})
              </button>
              <button
                onClick={() => bulkToggleUsersMutation.mutate({ action: 'deactivate', ids: Array.from(selectedUserIds) })}
                disabled={bulkToggleUsersMutation.isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-neon/10 border border-rose-neon/30 text-rose-neon text-xs font-semibold hover:bg-rose-neon/20 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <Ban className="w-3.5 h-3.5" />
                Désactiver ({selectedUserIds.size})
              </button>
              <button
                onClick={() => setSelectedUserIds(new Set())}
                className="text-white/30 hover:text-white transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}


      {/* ── Scanners tab ── */}
      {tab === 'scanners' && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-5">
            <p className="text-white/40 text-sm">Créez des comptes scanner et assignez-les à un événement.</p>
            <Button variant="secondary" size="sm" className="flex-shrink-0" onClick={() => { setShowScannerForm((v) => !v); setCreatedScannerCreds(null); }}>
              {showScannerForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showScannerForm ? 'Annuler' : 'Nouveau scanner'}
            </Button>
          </div>

          {/* Credentials block */}
          <AnimatePresence>
            {createdScannerCreds && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 font-semibold text-sm">Compte scanner créé — transmettez ces identifiants à l'agent</p>
                  </div>
                  <div className="space-y-1.5 text-sm font-mono">
                    <div className="flex justify-between bg-bg-secondary rounded-lg px-3 py-2">
                      <span className="text-white/40">Téléphone</span>
                      <span className="text-white">{createdScannerCreds.phone}</span>
                    </div>
                    <div className="flex justify-between bg-bg-secondary rounded-lg px-3 py-2">
                      <span className="text-white/40">Mot de passe</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white">{showScannerPassword ? createdScannerCreds.password : '••••••••'}</span>
                        <button onClick={() => setShowScannerPassword((v) => !v)} className="text-white/40 hover:text-white">
                          {showScannerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setCreatedScannerCreds(null)} className="mt-3 text-xs text-white/30 hover:text-white/60">Masquer</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Creation form */}
          <AnimatePresence>
            {showScannerForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-5"
              >
                <div className="glass-card p-5 border border-cyan-neon/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Prénom */}
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Prénom</label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={scannerForm.firstName}
                      onChange={(e) => setScannerForm((f) => ({ ...f, firstName: e.target.value }))}
                      placeholder="Prénom"
                      className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                    />
                  </div>
                  {/* Nom */}
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Nom</label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={scannerForm.lastName}
                      onChange={(e) => setScannerForm((f) => ({ ...f, lastName: e.target.value }))}
                      placeholder="Nom"
                      className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                    />
                  </div>
                  {/* Téléphone */}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Téléphone</label>
                    <input
                      type="tel"
                      autoComplete="off"
                      value={scannerForm.phone}
                      onChange={(e) => setScannerForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="07 00 00 00"
                      className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                    />
                  </div>
                  {/* Mot de passe */}
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Mot de passe</label>
                    <div className="relative">
                      <input
                        type={showScannerPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={scannerForm.password}
                        onChange={(e) => setScannerForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Min. 8 caractères"
                        className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 pr-10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowScannerPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                      >
                        {showScannerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Confirmer mot de passe */}
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Confirmer le mot de passe</label>
                    <div className="relative">
                      <input
                        type={showScannerConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={scannerForm.confirmPassword}
                        onChange={(e) => setScannerForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                        placeholder="Répéter le mot de passe"
                        className={`w-full bg-bg-secondary border rounded-xl px-3 py-2.5 pr-10 text-white text-sm placeholder-white/20 focus:outline-none transition-colors ${
                          scannerForm.confirmPassword && scannerForm.confirmPassword !== scannerForm.password
                            ? 'border-rose-neon/60 focus:border-rose-neon'
                            : 'border-violet-neon/20 focus:border-violet-neon'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowScannerConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                      >
                        {showScannerConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {scannerForm.confirmPassword && scannerForm.confirmPassword !== scannerForm.password && (
                      <p className="text-xs text-rose-neon mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>
                  {/* Événements */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-white/40 uppercase tracking-widest">
                        Événements assignés
                        {scannerForm.eventIds.length > 0 && (
                          <span className="ml-2 text-cyan-neon normal-case tracking-normal">{scannerForm.eventIds.length} sélectionné{scannerForm.eventIds.length > 1 ? 's' : ''}</span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = (publishedEventsData ?? []).map((ev: Record<string, unknown>) => ev.id as string);
                          const allSelected = scannerForm.eventIds.length === allIds.length;
                          setScannerForm((f) => ({ ...f, eventIds: allSelected ? [] : allIds }));
                        }}
                        className="text-xs text-violet-neon hover:text-white transition-colors"
                      >
                        {scannerForm.eventIds.length === (publishedEventsData ?? []).length && (publishedEventsData ?? []).length > 0 ? 'Désélectionner tout' : 'Tout'}
                      </button>
                    </div>
                    <div className="border border-violet-neon/20 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-bg-secondary">
                      {(publishedEventsData ?? []).length === 0 ? (
                        <p className="text-white/30 text-sm px-3 py-3">Aucun événement disponible</p>
                      ) : (
                        (publishedEventsData ?? []).map((ev: Record<string, unknown>) => {
                          const id = ev.id as string;
                          const checked = scannerForm.eventIds.includes(id);
                          return (
                            <label
                              key={id}
                              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/5 ${checked ? 'bg-violet-neon/10' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setScannerForm((f) => ({
                                  ...f,
                                  eventIds: checked
                                    ? f.eventIds.filter((eid) => eid !== id)
                                    : [...f.eventIds, id],
                                }))}
                                className="accent-violet-neon w-4 h-4 flex-shrink-0"
                              />
                              <span className="text-sm text-white/80 truncate">{ev.title as string}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => createScanner.mutate(scannerForm)}
                      isLoading={createScanner.isLoading}
                      disabled={
                        !scannerForm.firstName ||
                        !scannerForm.lastName ||
                        !scannerForm.phone ||
                        !scannerForm.password ||
                        scannerForm.password !== scannerForm.confirmPassword ||
                        scannerForm.eventIds.length === 0
                      }
                    >
                      <ScanLine className="w-4 h-4" />
                      Créer le compte scanner
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scanner list */}
          {scannersLoading ? (
            <SkeletonTable rows={4} />
          ) : !scannersData?.length ? (
            <div className="glass-card p-16 text-center">
              <ScanLine className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40">Aucun agent de scan créé</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                      <th className="text-left px-5 py-3">Agent</th>
                      <th className="text-left px-5 py-3 hidden sm:table-cell">Téléphone</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Événements assignés</th>
                      <th className="text-center px-5 py-3 hidden sm:table-cell">Scans</th>
                      <th className="text-center px-5 py-3">Statut</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {scannersData.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 sm:px-5 py-4">
                          <p className="text-white font-semibold text-sm">{s.user.firstName} {s.user.lastName}</p>
                          {s.user.email && <p className="text-white/30 text-xs mt-0.5 hidden sm:block">{s.user.email}</p>}
                        </td>
                        <td className="px-5 py-4 text-white/60 text-xs font-mono hidden sm:table-cell">{s.user.phone || '—'}</td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {s.events.slice(0, 3).map((ev) => (
                              <span key={ev.id} className="text-[11px] px-2 py-0.5 rounded-full bg-violet-neon/10 text-violet-neon border border-violet-neon/20 truncate max-w-[140px]" title={ev.title}>
                                {ev.title}
                              </span>
                            ))}
                            {s.events.length > 3 && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                                +{s.events.length - 3}
                              </span>
                            )}
                            {s.events.length === 0 && <span className="text-white/20 text-xs">Aucun</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center hidden sm:table-cell">
                          <p className="text-white font-semibold">{s.scanCount}</p>
                          <p className="text-white/30 text-xs">{s.validScanCount} valides</p>
                        </td>
                        <td className="px-4 sm:px-5 py-4 text-center">
                          {s.user.isActive ? (
                            <span className="text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-green-500/20 text-green-400 font-semibold whitespace-nowrap">Actif</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-rose-neon/20 text-rose-neon font-semibold whitespace-nowrap">Bloqué</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-5 py-4">
                          <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
                            <Button
                              variant={s.user.isActive ? 'danger' : 'secondary'}
                              size="sm"
                              onClick={() => toggleScannerMutation.mutate({ id: s.id, isActive: !s.user.isActive })}
                              isLoading={toggleScannerMutation.isLoading}
                            >
                              {s.user.isActive ? 'Bloquer' : 'Activer'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingScanner(s)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-white/5 text-xs text-white/30">
                {scannersData.length} agent{scannersData.length > 1 ? 's' : ''} de scan
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Refunds tab ── */}
      {tab === 'refunds' && (
        <div>
          <p className="text-white/40 text-sm mb-5">Demandes de remboursement soumises par les acheteurs.</p>
          <h3 className="font-bebas text-xl tracking-wider text-white/60 mb-3">Remboursements commande entière</h3>
          {refundsLoading ? (
            <SkeletonTable rows={4} />
          ) : !refundsData?.length ? (
            <div className="glass-card p-16 text-center">
              <RotateCcw className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40">Aucune demande de remboursement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {refundsData.map((order: {
                id: string;
                refundStatus: string;
                refundReason: string | null;
                refundAdminNote: string | null;
                refundRequestedAt: string | null;
                totalAmount: number;
                buyer: { firstName: string; lastName: string; email: string | null; phone: string | null };
                event: { title: string; eventDate: string };
              }) => (
                <div key={order.id} className={`glass-card p-5 border transition-colors ${selectedRefundIds.has(order.id) ? 'border-violet-neon/40 bg-violet-neon/[0.03]' : 'border-white/5'}`}>
                  <div className="flex items-start gap-3">
                    {order.refundStatus === 'REQUESTED' && (
                      <button
                        onClick={() => setSelectedRefundIds((prev) => { const next = new Set(prev); next.has(order.id) ? next.delete(order.id) : next.add(order.id); return next; })}
                        className="text-white/30 hover:text-violet-neon transition-colors mt-0.5 flex-shrink-0"
                      >
                        {selectedRefundIds.has(order.id) ? <CheckSquare className="w-4 h-4 text-violet-neon" /> : <Square className="w-4 h-4" />}
                      </button>
                    )}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          order.refundStatus === 'REQUESTED' ? 'bg-yellow-500/20 text-yellow-400' :
                          order.refundStatus === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                          'bg-white/10 text-white/40'
                        }`}>
                          {order.refundStatus === 'REQUESTED' ? 'En attente' :
                           order.refundStatus === 'APPROVED' ? 'Approuvé' : 'Refusé'}
                        </span>
                        <span className="font-mono text-cyan-neon text-xs">{formatPrice(order.totalAmount)}</span>
                      </div>
                      <p className="text-white font-semibold truncate">{order.event.title}</p>
                      <p className="text-white/40 text-xs">{formatEventDate(order.event.eventDate)}</p>
                      <p className="text-white/50 text-xs mt-1">
                        {order.buyer.firstName} {order.buyer.lastName}
                        {order.buyer.email ? ` — ${order.buyer.email}` : ''}
                        {order.buyer.phone ? ` — ${order.buyer.phone}` : ''}
                      </p>
                      {order.refundReason && (
                        <p className="text-white/40 text-xs mt-1 italic">"{order.refundReason}"</p>
                      )}
                      {order.refundRequestedAt && (
                        <p className="text-white/25 text-xs mt-0.5">
                          Soumis le {new Date(order.refundRequestedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    {order.refundStatus === 'REQUESTED' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => processRefund.mutate({ orderId: order.id, action: 'approve' })}
                          isLoading={processRefund.isLoading}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approuver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const note = window.prompt('Motif du refus (optionnel) :') ?? undefined;
                            processRefund.mutate({ orderId: order.id, action: 'reject', adminNote: note });
                          }}
                          isLoading={processRefund.isLoading}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeter
                        </Button>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Barre d'actions en masse remboursements commandes */}
          {selectedRefundIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 sm:gap-3 glass-card px-4 sm:px-5 py-3 border border-violet-neon/30 shadow-neon rounded-2xl max-w-[calc(100vw-2rem)]">
              <span className="text-sm text-white/60 font-semibold whitespace-nowrap">
                {selectedRefundIds.size} commande{selectedRefundIds.size > 1 ? 's' : ''}
              </span>
              <div className="w-px h-5 bg-white/10" />
              <button
                onClick={() => bulkRefundsMutation.mutate({ action: 'approve', ids: Array.from(selectedRefundIds) })}
                disabled={bulkRefundsMutation.isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approuver ({selectedRefundIds.size})
              </button>
              <button
                onClick={() => bulkRefundsMutation.mutate({ action: 'reject', ids: Array.from(selectedRefundIds) })}
                disabled={bulkRefundsMutation.isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-neon/10 border border-rose-neon/30 text-rose-neon text-xs font-semibold hover:bg-rose-neon/20 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5" />
                Rejeter ({selectedRefundIds.size})
              </button>
              <button onClick={() => setSelectedRefundIds(new Set())} className="text-white/30 hover:text-white transition-colors ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Ticket-level refunds ── */}
          <h3 className="font-bebas text-xl tracking-wider text-white/60 mt-10 mb-3">Remboursements billet individuel</h3>
          {ticketRefundsLoading ? (
            <SkeletonTable rows={3} />
          ) : !ticketRefundsData?.length ? (
            <div className="glass-card p-10 text-center">
              <p className="text-white/30 text-sm">Aucune demande de remboursement de billet individuel</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ticketRefundsData.map((ticket: {
                id: string;
                refundStatus: string;
                refundReason: string | null;
                refundAdminNote: string | null;
                refundRequestedAt: string | null;
                buyer: { firstName: string; lastName: string; email: string | null; phone: string | null };
                category: { name: string; event: { title: string; eventDate: string } };
                order: { id: string };
              }) => (
                <div key={ticket.id} className={`glass-card p-4 flex items-start gap-3 transition-colors ${selectedTicketRefundIds.has(ticket.id) ? 'border border-violet-neon/40 bg-violet-neon/[0.03]' : 'border border-white/5'}`}>
                  {ticket.refundStatus === 'REQUESTED' && (
                    <button
                      onClick={() => setSelectedTicketRefundIds((prev) => { const next = new Set(prev); next.has(ticket.id) ? next.delete(ticket.id) : next.add(ticket.id); return next; })}
                      className="text-white/30 hover:text-violet-neon transition-colors mt-0.5 flex-shrink-0"
                    >
                      {selectedTicketRefundIds.has(ticket.id) ? <CheckSquare className="w-4 h-4 text-violet-neon" /> : <Square className="w-4 h-4" />}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        ticket.refundStatus === 'REQUESTED' ? 'bg-yellow-500/20 text-yellow-400' :
                        ticket.refundStatus === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                        'bg-white/10 text-white/40'
                      }`}>
                        {ticket.refundStatus === 'REQUESTED' ? 'En attente' :
                         ticket.refundStatus === 'APPROVED' ? 'Approuvé' : 'Refusé'}
                      </span>
                      <span className="text-xs text-white/60 font-medium">{ticket.category.event.title}</span>
                      <span className="text-xs text-white/40">— {ticket.category.name}</span>
                    </div>
                    <p className="text-sm text-white/70">
                      {ticket.buyer.firstName} {ticket.buyer.lastName}
                      {ticket.buyer.email ? ` — ${ticket.buyer.email}` : ''}
                      {ticket.buyer.phone ? ` — ${ticket.buyer.phone}` : ''}
                    </p>
                    {ticket.refundReason && (
                      <p className="text-white/40 text-xs mt-1 italic">"{ticket.refundReason}"</p>
                    )}
                    {ticket.refundRequestedAt && (
                      <p className="text-white/25 text-xs mt-0.5">
                        Soumis le {new Date(ticket.refundRequestedAt).toLocaleDateString('fr-FR')}
                        {' — '}Billet <span className="font-mono">{ticket.id.slice(0, 8)}</span>
                      </p>
                    )}
                  </div>
                  {ticket.refundStatus === 'REQUESTED' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => processTicketRefundMutation.mutate({ ticketId: ticket.id, action: 'approve' })}
                        isLoading={processTicketRefundMutation.isLoading}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approuver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const note = window.prompt('Motif du refus (optionnel) :') ?? undefined;
                          processTicketRefundMutation.mutate({ ticketId: ticket.id, action: 'reject', adminNote: note });
                        }}
                        isLoading={processTicketRefundMutation.isLoading}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Barre d'actions en masse remboursements billets */}
          {selectedTicketRefundIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 sm:gap-3 glass-card px-4 sm:px-5 py-3 border border-violet-neon/30 shadow-neon rounded-2xl max-w-[calc(100vw-2rem)]">
              <span className="text-sm text-white/60 font-semibold whitespace-nowrap">
                {selectedTicketRefundIds.size} billet{selectedTicketRefundIds.size > 1 ? 's' : ''}
              </span>
              <div className="w-px h-5 bg-white/10" />
              <button
                onClick={() => bulkTicketRefundsMutation.mutate({ action: 'approve', ids: Array.from(selectedTicketRefundIds) })}
                disabled={bulkTicketRefundsMutation.isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approuver ({selectedTicketRefundIds.size})
              </button>
              <button
                onClick={() => bulkTicketRefundsMutation.mutate({ action: 'reject', ids: Array.from(selectedTicketRefundIds) })}
                disabled={bulkTicketRefundsMutation.isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-neon/10 border border-rose-neon/30 text-rose-neon text-xs font-semibold hover:bg-rose-neon/20 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5" />
                Rejeter ({selectedTicketRefundIds.size})
              </button>
              <button onClick={() => setSelectedTicketRefundIds(new Set())} className="text-white/30 hover:text-white transition-colors ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Retraits tab ── */}
      {tab === 'retraits' && (() => {
        const allOrgs = payoutsData ?? [];

        const allPayouts = allOrgs
          .flatMap((org) => (org.payoutHistory ?? []).map((p) => ({ ...p, companyName: org.companyName })))
          .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());

        // Corriger le bug : exclure les FAILED du total versé
        const successPayouts   = allPayouts.filter(p => p.pvitStatus !== 'FAILED');
        const totalVersé       = successPayouts.reduce((s, p) => s + p.amountSent, 0);
        const totalNet         = allOrgs.reduce((s, org) => s + org.totalNetAmount, 0);
        const totalDû          = allOrgs.reduce((s, org) => s + org.balanceDue, 0);
        const orgsWithBalance  = allOrgs.filter(org => (org.airtelBalance ?? 0) > 0 || (org.moovBalance ?? 0) > 0).length;

        const PAYOUT_ST: Record<string, { label: string; color: string; bg: string }> = {
          SUCCESS:      { label: 'Confirmé',  color: 'text-green-400',    bg: 'bg-green-500/10'   },
          PENDING:      { label: 'En cours',  color: 'text-amber-400',    bg: 'bg-amber-400/10'   },
          PENDING_LOCK: { label: 'En cours',  color: 'text-amber-400',    bg: 'bg-amber-400/10'   },
          FAILED:       { label: 'Échoué',    color: 'text-rose-400',     bg: 'bg-rose-500/10'    },
          PARTIAL:      { label: 'Partiel',   color: 'text-orange-400',   bg: 'bg-orange-400/10'  },
          SCHEDULED:    { label: 'Programmé', color: 'text-violet-neon',  bg: 'bg-violet-neon/10' },
        };

        const TIER_CFG: Record<string, { label: string; color: string }> = {
          NEW:       { label: 'Nouveau',  color: 'text-white/30'   },
          APPROVED:  { label: 'Approuvé', color: 'text-cyan-neon'  },
          CERTIFIED: { label: 'Certifié', color: 'text-violet-neon'},
          PREMIUM:   { label: 'Premium',  color: 'text-yellow-400' },
        };

        const filteredOrgs = allOrgs
          .filter(org => {
            const q = orgSearch.toLowerCase();
            return !q || org.companyName.toLowerCase().includes(q)
              || `${org.user.firstName} ${org.user.lastName}`.toLowerCase().includes(q);
          })
          .sort((a, b) => (b.airtelBalance + b.moovBalance) - (a.airtelBalance + a.moovBalance));

        const JPAGE = 15;
        const jTotalPages  = Math.ceil(allPayouts.length / JPAGE);
        const jPaginated   = allPayouts.slice((journalPage - 1) * JPAGE, journalPage * JPAGE);

        return (
          <div className="space-y-8">

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-4 border border-cyan-neon/20">
                <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">Net total organisateurs</p>
                <p className="font-mono font-bold text-lg text-cyan-neon">{formatPrice(totalNet, 'FCFA', '0 FCFA')}</p>
                <p className="text-[10px] text-white/25 mt-0.5">Montant total à verser</p>
              </div>
              <div className="glass-card p-4 border border-green-500/20">
                <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">Total versé</p>
                <p className="font-mono font-bold text-lg text-green-400">{formatPrice(totalVersé, 'FCFA', '0 FCFA')}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{successPayouts.length} retrait{successPayouts.length > 1 ? 's' : ''} confirmé{successPayouts.length > 1 ? 's' : ''}</p>
              </div>
              <div className={`glass-card p-4 border ${totalDû > 0 ? 'border-yellow-500/20' : 'border-white/5'}`}>
                <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">Solde restant dû</p>
                <p className={`font-mono font-bold text-lg ${totalDû > 0 ? 'text-yellow-400' : 'text-white/30'}`}>{formatPrice(totalDû, 'FCFA', '0 FCFA')}</p>
                <p className="text-[10px] text-white/25 mt-0.5">À virer aux organisateurs</p>
              </div>
              <div className={`glass-card p-4 border ${orgsWithBalance > 0 ? 'border-rose-neon/20' : 'border-white/5'}`}>
                <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">Orgs. en attente</p>
                <p className={`font-mono font-bold text-lg ${orgsWithBalance > 0 ? 'text-rose-neon' : 'text-white/30'}`}>{orgsWithBalance}</p>
                <p className="text-[10px] text-white/25 mt-0.5">Solde non encore retiré</p>
              </div>
            </div>

            {/* ── Tableau organisateurs ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-bebas text-xl tracking-wider text-white/70">
                  Organisateurs <span className="text-white/30 text-base">({allOrgs.length})</span>
                </h2>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/25 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={orgSearch}
                    onChange={e => setOrgSearch(e.target.value)}
                    placeholder="Rechercher un organisateur…"
                    className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-neon transition-colors w-56"
                  />
                </div>
              </div>

              {payoutsLoading ? <SkeletonTable rows={5} /> : (
                <div className="glass-card overflow-hidden border border-white/[0.06]">
                  {/* Header desktop */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_36px] gap-2 px-4 py-2.5 border-b border-white/5 text-[10px] text-white/25 uppercase tracking-widest bg-white/[0.02]">
                    <span>Société / Tier</span>
                    <span className="text-right">Collecté</span>
                    <span className="text-right">Net org.</span>
                    <span className="text-right">Airtel dû</span>
                    <span className="text-right">Moov dû</span>
                    <span className="text-right">Solde total</span>
                    <span />
                  </div>

                  {filteredOrgs.length === 0 ? (
                    <div className="py-16 text-center text-white/30 text-sm">Aucun résultat</div>
                  ) : filteredOrgs.map((org) => {
                    const isExp  = expandedOrg === org.organizerId;
                    const tier   = org.isPremium ? 'PREMIUM' : org.isCertified ? 'CERTIFIED' : org.isApproved ? 'APPROVED' : 'NEW';
                    const tc     = TIER_CFG[tier];
                    const ab     = org.airtelBalance ?? 0;
                    const mb     = org.moovBalance   ?? 0;
                    const solde  = ab + mb;
                    const hasDue = solde > 0;

                    return (
                      <div key={org.organizerId} className="border-b border-white/[0.04] last:border-0">
                        {/* Row */}
                        <button
                          onClick={() => setExpandedOrg(isExp ? null : org.organizerId)}
                          className="w-full text-left hover:bg-white/[0.02] transition-colors px-4 py-3.5"
                        >
                          {/* Mobile */}
                          <div className="md:hidden flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{org.companyName}</p>
                              <p className={`text-[10px] font-semibold ${tc.color}`}>{tc.label} · {org.user.firstName} {org.user.lastName}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className={`font-mono font-bold text-sm ${hasDue ? 'text-yellow-400' : 'text-green-400'}`}>
                                  {hasDue ? formatPrice(solde, 'FCFA') : '✓ Soldé'}
                                </p>
                                {hasDue && <p className="text-[10px] text-white/30">dû</p>}
                              </div>
                              <ChevronDown className={`w-4 h-4 text-white/25 transition-transform flex-shrink-0 ${isExp ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          {/* Desktop */}
                          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_36px] gap-2 items-center">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{org.companyName}</p>
                              <p className={`text-[10px] font-semibold ${tc.color}`}>{tc.label} · {org.user.firstName} {org.user.lastName}</p>
                            </div>
                            <p className="font-mono text-xs text-white/50 text-right">{formatPrice(org.totalCollected, 'FCFA', '0')}</p>
                            <p className="font-mono text-xs text-cyan-neon font-semibold text-right">{formatPrice(org.totalNetAmount, 'FCFA', '0')}</p>
                            <p className={`font-mono text-xs text-right font-semibold ${ab > 0 ? 'text-rose-neon' : 'text-white/20'}`}>{formatPrice(ab, 'FCFA', '—')}</p>
                            <p className={`font-mono text-xs text-right font-semibold ${mb > 0 ? 'text-cyan-neon' : 'text-white/20'}`}>{formatPrice(mb, 'FCFA', '—')}</p>
                            <p className={`font-mono text-xs font-bold text-right ${hasDue ? 'text-yellow-400' : 'text-green-400'}`}>
                              {hasDue ? formatPrice(solde, 'FCFA') : '✓ Soldé'}
                            </p>
                            <div className="flex justify-center">
                              <ChevronDown className={`w-4 h-4 text-white/25 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </button>

                        {/* Expanded */}
                        {isExp && (
                          <div className="border-t border-white/[0.04] bg-white/[0.015] px-4 py-4 space-y-4">
                            {/* Tier selector + contacts */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs text-white/25">Tier :</p>
                                {[
                                  { key: 'APPROVED',  label: 'Approuvé', flags: { isApproved: true,  isCertified: false, isPremium: false } },
                                  { key: 'CERTIFIED', label: 'Certifié', flags: { isApproved: true,  isCertified: true,  isPremium: false } },
                                  { key: 'PREMIUM',   label: 'Premium',  flags: { isApproved: true,  isCertified: true,  isPremium: true  } },
                                ].map((t) => {
                                  const isActive = tier === t.key;
                                  return (
                                    <button key={t.key}
                                      onClick={() => !isActive && updateOrgTier.mutate({ organizerId: org.organizerId, ...t.flags })}
                                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${isActive ? 'bg-violet-neon/20 text-violet-neon border border-violet-neon/30' : 'text-white/25 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                    >{t.label}</button>
                                  );
                                })}
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-white/35">
                                <span>{org.user.email}</span>
                                {org.user.phone && <span className="font-mono text-cyan-neon/60">{org.user.phone}</span>}
                                {org.airtelNumber && <span className="text-rose-neon/60">Airtel : {org.airtelNumber}</span>}
                                {org.moovNumber   && <span className="text-cyan-neon/60">Moov : {org.moovNumber}</span>}
                              </div>
                            </div>

                            {/* Événements */}
                            {org.events.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {org.events.map(ev => (
                                  <span key={ev.id} className="text-[11px] bg-white/[0.04] border border-white/10 rounded-full px-2.5 py-0.5 text-white/40">{ev.title}</span>
                                ))}
                              </div>
                            )}

                            {/* Historique retraits */}
                            {org.payoutHistory.length > 0 ? (
                              <div>
                                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">Retraits effectués</p>
                                <div className="space-y-1.5">
                                  {org.payoutHistory.map(p => {
                                    const st = PAYOUT_ST[p.pvitStatus] ?? PAYOUT_ST.PENDING;
                                    return (
                                      <div key={p.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5 text-xs">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.color}`}>{st.label}</span>
                                          <span className="font-mono font-bold text-white/70">{formatPrice(p.amountSent, 'FCFA')}</span>
                                          <span className={p.operator === 'AIRTEL_MONEY' ? 'text-rose-neon/70' : 'text-cyan-neon/70'}>{p.operator === 'AIRTEL_MONEY' ? 'Airtel' : 'Moov'}</span>
                                          <span className="text-white/30 font-mono">{p.mobileMoney}</span>
                                          {p.transactionRef && <span className="text-white/20 font-mono hidden sm:inline">#{p.transactionRef}</span>}
                                        </div>
                                        <span className="text-white/25 flex-shrink-0 ml-2">
                                          {new Date(p.processedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-white/25 italic flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" /> Aucun retrait pour cet organisateur
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Journal global des retraits ── */}
            {allPayouts.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-bebas text-xl tracking-wider text-white/70">
                  Journal des retraits <span className="text-white/30 text-base">({allPayouts.length})</span>
                </h2>
                <div className="glass-card overflow-hidden border border-white/[0.06]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] text-white/25 uppercase tracking-widest bg-white/[0.02]">
                          <th className="text-left px-4 py-3">Date</th>
                          <th className="text-left px-4 py-3">Organisateur</th>
                          <th className="text-right px-4 py-3">Montant</th>
                          <th className="text-left px-4 py-3 hidden sm:table-cell">Opérateur</th>
                          <th className="text-left px-4 py-3 hidden md:table-cell">N° Mobile</th>
                          <th className="text-left px-4 py-3">Statut</th>
                          <th className="text-left px-4 py-3 hidden xl:table-cell">Réf.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {jPaginated.map((p) => {
                          const st = PAYOUT_ST[p.pvitStatus] ?? PAYOUT_ST.PENDING;
                          return (
                            <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                                {new Date(p.processedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-white text-xs font-semibold">{p.companyName}</td>
                              <td className="px-4 py-3 font-mono font-bold text-right whitespace-nowrap text-white/80">{formatPrice(p.amountSent, 'FCFA')}</td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className={`text-xs font-semibold ${p.operator === 'AIRTEL_MONEY' ? 'text-rose-neon' : 'text-cyan-neon'}`}>
                                  {p.operator === 'AIRTEL_MONEY' ? 'Airtel' : 'Moov'}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-white/40">{p.mobileMoney}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.bg} ${st.color}`}>{st.label}</span>
                              </td>
                              <td className="px-4 py-3 hidden xl:table-cell font-mono text-xs text-white/25">{p.transactionRef ?? '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between gap-4">
                    <p className="text-xs text-white/25">
                      {((journalPage-1)*JPAGE)+1}–{Math.min(journalPage*JPAGE, allPayouts.length)} sur {allPayouts.length}
                    </p>
                    {jTotalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setJournalPage(p => p-1)} disabled={journalPage === 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-all">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] text-white/35 px-2 font-mono">{journalPage} / {jTotalPages}</span>
                        <button onClick={() => setJournalPage(p => p+1)} disabled={journalPage === jTotalPages}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs font-mono text-green-400 font-bold">Total versé : {formatPrice(totalVersé, 'FCFA')}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* ── Audit logs tab ── */}
      {tab === 'audit' && (
        <div>
          <p className="text-white/40 text-sm mb-5">Journal de toutes les actions administratives effectuées sur la plateforme.</p>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              value={auditActionFilter}
              onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
              placeholder="Filtrer par action..."
              className="bg-bg-card border border-violet-neon/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-violet-neon transition-colors text-sm w-full sm:w-52"
            />
            <input
              value={auditEntityFilter}
              onChange={(e) => { setAuditEntityFilter(e.target.value); setAuditPage(1); }}
              placeholder="Filtrer par entité..."
              className="bg-bg-card border border-violet-neon/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-violet-neon transition-colors text-sm w-full sm:w-52"
            />
            {(auditActionFilter || auditEntityFilter) && (
              <button
                onClick={() => { setAuditActionFilter(''); setAuditEntityFilter(''); setAuditPage(1); }}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-rose-neon hover:border-rose-neon/30 transition-colors"
              >
                <X className="w-3 h-3" /> Réinitialiser
              </button>
            )}
          </div>

          {auditLoading ? (
            <SkeletonTable rows={8} />
          ) : !auditData?.logs?.length ? (
            <div className="glass-card p-16 text-center">
              <ScrollText className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40">Aucune entrée dans le journal d'audit</p>
            </div>
          ) : (
            <>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                        <th className="text-left px-5 py-3">Date</th>
                        <th className="text-left px-5 py-3">Action</th>
                        <th className="text-left px-5 py-3">Entité</th>
                        <th className="text-left px-5 py-3">Acteur</th>
                        <th className="text-left px-5 py-3 hidden lg:table-cell">IP</th>
                        <th className="text-left px-5 py-3 hidden xl:table-cell">Données</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditData.logs.map((log) => (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 text-white/40 text-xs whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                              log.action.includes('APPROVE') || log.action.includes('ACTIVATE') ? 'bg-green-500/15 text-green-400' :
                              log.action.includes('REJECT') || log.action.includes('BLOCK') || log.action.includes('ANONYMIZE') ? 'bg-rose-neon/15 text-rose-neon' :
                              log.action.includes('CREATE') || log.action.includes('PAYOUT') ? 'bg-cyan-neon/15 text-cyan-neon' :
                              'bg-white/10 text-white/60'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-white/70 text-xs">{log.entity}</span>
                            {log.entityId && (
                              <p className="text-white/25 text-xs font-mono">{log.entityId.slice(0, 8)}…</p>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {log.user ? (
                              <>
                                <p className="text-white text-xs font-semibold">{log.user.firstName} {log.user.lastName}</p>
                                <p className="text-white/30 text-xs">{log.user.role}</p>
                              </>
                            ) : (
                              <span className="text-white/25 text-xs">Système</span>
                            )}
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell text-white/30 text-xs font-mono">
                            {log.ipAddress ?? '—'}
                          </td>
                          <td className="px-5 py-3 hidden xl:table-cell text-white/30 text-xs font-mono max-w-xs truncate">
                            {log.newData ? JSON.stringify(log.newData) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
                  <span>{auditData.total} entrée{auditData.total > 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={auditPage === 1}
                      onClick={() => setAuditPage((p) => p - 1)}
                      className="px-3 py-1 rounded-lg border border-white/10 hover:border-violet-neon/30 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <span>{auditPage} / {Math.ceil(auditData.total / 50) || 1}</span>
                    <button
                      disabled={auditPage * 50 >= auditData.total}
                      onClick={() => setAuditPage((p) => p + 1)}
                      className="px-3 py-1 rounded-lg border border-white/10 hover:border-violet-neon/30 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Settings tab ── */}
      {tab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          {/* Commission tiers — fixed, read-only */}
          <div className="glass-card p-6 border border-white/5">
            <h3 className="font-bebas text-xl tracking-wider text-white/60 mb-1">Taux de commission</h3>
            <p className="text-white/30 text-xs mb-4">Taux fixes appliqués par l'organisateur au moment de la création de l'événement.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Standard', rate: '10 %', color: 'text-violet-neon', border: 'border-violet-neon/20', perks: 'Essentiel' },
                { label: 'Intermédiaire', rate: '15 %', color: 'text-rose-neon', border: 'border-rose-neon/20', perks: 'HOT + WhatsApp' },
                { label: 'Premium', rate: '20 %', color: 'text-cyan-neon', border: 'border-cyan-neon/20', perks: 'Visibilité max' },
              ].map(({ label, rate, color, border, perks }) => (
                <div key={label} className={`bg-white/[0.03] rounded-xl p-4 border ${border}`}>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{label}</p>
                  <p className={`font-bebas text-3xl ${color}`}>{rate}</p>
                  <p className="text-white/25 text-xs mt-1">{perks}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Free ticket fee — editable */}
          {configLoading ? (
            <SkeletonCard lines={3} />
          ) : (
            <div className="glass-card p-6 border border-violet-neon/20">
              <h3 className="font-bebas text-xl tracking-wider text-white/60 mb-1">Frais billet gratuit</h3>
              <p className="text-white/30 text-xs mb-4">Montant prélevé par billet sur les événements gratuits.</p>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-white/50 uppercase tracking-widest mb-1.5">Montant (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={freeTicketFeeInput}
                    onChange={(e) => setFreeTicketFeeInput(e.target.value)}
                    placeholder={`Actuel : ${platformConfig?.freeTicketFee?.toLocaleString('fr-FR') ?? '500'} FCFA`}
                    className="w-full bg-bg-card border border-violet-neon/20 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-violet-neon transition-colors text-sm"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!freeTicketFeeInput) { toast.error('Aucune valeur à modifier'); return; }
                    updateConfigMutation.mutate({ freeTicketFee: parseInt(freeTicketFeeInput) });
                  }}
                  isLoading={updateConfigMutation.isLoading}
                >
                  <CheckCircle className="w-4 h-4" />
                  Enregistrer
                </Button>
              </div>
              {platformConfig?.updatedAt && (
                <p className="text-white/20 text-xs mt-3">
                  Dernière mise à jour : {new Date(platformConfig.updatedAt).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          )}

          {/* PayIn / PayOut rates */}
          {configLoading ? (
            <SkeletonCard lines={4} />
          ) : (
            <div className="glass-card p-6 border border-cyan-neon/20 space-y-5">
              <div>
                <h3 className="font-bebas text-xl tracking-wider text-white/60 mb-0.5">Frais opérateurs Mobile Money</h3>
                <p className="text-white/30 text-xs">PayIn = frais à la charge de l'acheteur. PayOut = frais déduits du virement organisateur.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: 'airtelPayinRate',  label: 'Airtel PayIn (%)',   current: platformConfig?.airtelPayinRate  },
                  { key: 'moovPayinRate',    label: 'Moov PayIn (%)',     current: platformConfig?.moovPayinRate    },
                  { key: 'airtelPayoutRate', label: 'Airtel PayOut (%)',  current: platformConfig?.airtelPayoutRate },
                  { key: 'moovPayoutRate',   label: 'Moov PayOut (%)',    current: platformConfig?.moovPayoutRate   },
                ] as { key: keyof typeof rateInputs; label: string; current?: number }[]).map(({ key, label, current }) => (
                  <div key={key}>
                    <label className="block text-xs text-white/50 uppercase tracking-widest mb-1.5">{label}</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={rateInputs[key]}
                      onChange={(e) => setRateInputs((r) => ({ ...r, [key]: e.target.value }))}
                      placeholder={current !== undefined ? `Actuel : ${(current * 100).toFixed(1)} %` : 'ex: 2.5'}
                      className="w-full bg-bg-card border border-cyan-neon/20 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-cyan-neon transition-colors text-sm"
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  const payload: Record<string, number> = {};
                  for (const [k, v] of Object.entries(rateInputs)) {
                    if (v !== '') payload[k] = parseFloat(v) / 100;
                  }
                  if (Object.keys(payload).length === 0) { toast.error('Aucune valeur à modifier'); return; }
                  updateConfigMutation.mutate(payload);
                }}
                isLoading={updateConfigMutation.isLoading}
              >
                <CheckCircle className="w-4 h-4" /> Enregistrer les taux
              </Button>
            </div>
          )}

          {/* QR Code du site */}
          <div className="glass-card p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-4 h-4 text-violet-neon" />
              <h3 className="font-bebas text-xl tracking-wider text-white/60">QR Code du site</h3>
            </div>
            <p className="text-white/30 text-xs mb-4">
              Imprimez ce QR code sur vos supports marketing — il redirige vers billetgab.com et est scannable depuis l'appareil photo de tout smartphone.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-32 h-32 rounded-xl overflow-hidden bg-white p-1.5 flex-shrink-0">
                {siteQrObjectUrl ? (
                  <img src={siteQrObjectUrl} alt="QR billetgab.com" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-white/10 animate-pulse rounded-lg" />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold text-sm">billetgab.com</p>
                <p className="text-white/35 text-xs max-w-xs leading-relaxed">
                  QR haute résolution 500×500 px. Idéal pour flyers, affiches et supports imprimés.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const { data } = await api.get(`/utils/qr?url=${encodeURIComponent('https://billetgab.com')}`, { responseType: 'blob' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(new Blob([data], { type: 'image/png' }));
                      link.download = 'qr-billetgab.png';
                      link.click();
                      URL.revokeObjectURL(link.href);
                    } catch {
                      toast.error('Erreur téléchargement QR code');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-neon/10 border border-violet-neon/30 text-violet-neon hover:bg-violet-neon/20 transition-colors text-sm font-semibold"
                >
                  <Download className="w-4 h-4" /> Télécharger en PNG
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Influenceurs tab ── */}
      {tab === 'influenceurs' && (
        <div className="space-y-4">
          <div>
            <h2 className="font-bebas text-2xl tracking-wider text-white">VERSEMENTS INFLUENCEURS</h2>
            <p className="text-white/40 text-xs mt-1">Demandes de versement de commission faites par les influenceurs.</p>
          </div>

          {influencerPayoutsLoading ? (
            <SkeletonTable rows={4} />
          ) : !influencerPayoutsData?.length ? (
            <div className="glass-card p-16 text-center">
              <Ticket className="w-12 h-12 text-violet-neon/20 mx-auto mb-3" />
              <p className="text-white/40">Aucune demande de versement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {influencerPayoutsData.map((p) => (
                <div key={p.id} className={`glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${p.status === 'PENDING' ? 'border border-amber-400/20' : ''}`}>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        p.status === 'PENDING' ? 'bg-amber-400/20 text-amber-400' :
                        p.status === 'PAID' ? 'bg-emerald-400/20 text-emerald-400' :
                        'bg-rose-neon/20 text-rose-neon'
                      }`}>
                        {p.status === 'PENDING' ? 'En attente' : p.status === 'PAID' ? 'Versé' : 'Rejeté'}
                      </span>
                      <span className="text-white font-semibold font-mono">{formatPrice(Number(p.amount))}</span>
                      <span className="text-white/40 text-xs">{p.operator === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'} · {p.phoneNumber}</span>
                    </div>
                    <p className="text-sm text-white/70">
                      {p.influencer.firstName} {p.influencer.lastName}
                      <span className="text-white/40 text-xs ml-2">{p.influencer.email}</span>
                    </p>
                    <p className="text-xs text-white/30">{new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {p.adminNote && <p className="text-xs text-white/40 italic">{p.adminNote}</p>}
                  </div>
                  {p.status === 'PENDING' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateInfluencerPayoutMutation.mutate({ payoutId: p.id, status: 'PAID' })}
                        isLoading={updateInfluencerPayoutMutation.isLoading}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Marquer payé
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const note = window.prompt('Motif du refus (optionnel) :') ?? undefined;
                          updateInfluencerPayoutMutation.mutate({ payoutId: p.id, status: 'REJECTED', adminNote: note });
                        }}
                        isLoading={updateInfluencerPayoutMutation.isLoading}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview modal */}
      <AnimatePresence>
        {previewEvent && (
          <EventPreviewModal event={previewEvent} onClose={() => setPreviewEvent(null)} />
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            eventTitle={rejectTarget.title}
            onConfirm={(reason) => {
              updateStatus.mutate({ id: rejectTarget.id, status: 'REJECTED', reason });
              setRejectTarget(null);
            }}
            onCancel={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Reject changes modal */}
      <AnimatePresence>
        {rejectChangesTarget && (
          <RejectModal
            eventTitle={rejectChangesTarget.title}
            onConfirm={(adminNote) => {
              rejectEventChanges.mutate({ eventId: rejectChangesTarget.id, adminNote });
              setRejectChangesTarget(null);
            }}
            onCancel={() => setRejectChangesTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Revision modal */}
      <AnimatePresence>
        {revisionTarget && (
          <RevisionModal
            eventTitle={revisionTarget.title}
            onConfirm={(adminNote) => {
              updateStatus.mutate({ id: revisionTarget.id, status: 'NEEDS_REVISION', adminNote });
              setRevisionTarget(null);
            }}
            onCancel={() => setRevisionTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit scanner modal */}
      <AnimatePresence>
        {editingScanner && (
          <EditScannerModal
            scanner={editingScanner}
            events={publishedEventsData ?? []}
            onClose={() => setEditingScanner(null)}
            onSave={(id, payload) => updateScannerMutation.mutate({ id, payload })}
            isLoading={updateScannerMutation.isLoading}
          />
        )}
      </AnimatePresence>

      {/* Delete event confirmation modal */}
      <AnimatePresence>
        {deleteEventTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteEventTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full border border-red-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bebas text-xl tracking-wider text-white mb-2">Supprimer l'événement ?</h3>
              <p className="text-sm text-white/60 mb-1">
                <span className="text-white font-medium">"{deleteEventTarget.title}"</span>
              </p>
              <p className="text-xs text-white/40 mb-6">
                Cette action est irréversible. Toutes les commandes, billets et paiements liés seront supprimés.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteEventTarget(null)}
                  className="flex-1 text-sm py-2 rounded-lg border border-white/10 text-white/50 hover:text-white/80 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteEventMutation.mutate(deleteEventTarget.id)}
                  disabled={deleteEventMutation.isLoading}
                  className="flex-1 text-sm py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-40"
                >
                  {deleteEventMutation.isLoading ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
