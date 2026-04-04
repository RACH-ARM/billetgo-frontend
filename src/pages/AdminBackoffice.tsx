import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CalendarDays, TrendingUp, Clock, CheckCircle, XCircle,
  ShieldAlert, LayoutDashboard, ListChecks, X, LogOut, Banknote, Phone,
  Star, Flame, Ban, Sparkles, ScanLine, Plus, Eye, EyeOff, Pencil, MessageSquare, FileSearch, RotateCcw, ScrollText, Settings,
  Square, CheckSquare, BadgeCheck, Award, Zap, Shield,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/common/Button';
import { SkeletonKpiGrid, SkeletonCard, SkeletonTable } from '../components/common/Skeleton';
import { formatPrice } from '../utils/formatPrice';
import { formatEventDate } from '../utils/formatDate';
import toast from 'react-hot-toast';

type TabType = 'dashboard' | 'events' | 'vitrine' | 'users' | 'payouts' | 'scanners' | 'refunds' | 'audit' | 'settings';

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
}
interface AdminPayoutOrganizer {
  organizerId: string;
  companyName: string;
  mobileMoneyNumber: string | null;
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

interface AdminPayoutSchedule {
  id: string;
  tranche: number;
  tier: string;
  percentage: number;
  scheduledDate: string;
  status: 'PENDING' | 'RELEASED' | 'CANCELLED';
  amountReleased: number | null;
  isEligible: boolean;
  trancheAmount: number;
  totalOrganizerAmount: number;
  event: { id: string; title: string; eventDate: string };
  organizer: {
    id: string;
    companyName: string;
    mobileMoneyNumber: string | null;
    user: { firstName: string; lastName: string; email: string };
  };
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
        className="glass-card p-6 w-full max-w-md border border-rose-neon/30"
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
        className="glass-card p-6 w-full max-w-md border border-yellow-400/30"
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
  user: { id: string; firstName: string; lastName: string; phone: string | null; isActive: boolean };
  event: { id: string; title: string; eventDate: string; organizer?: { companyName: string } };
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
  const [firstName, setFirstName] = useState(scanner.user.firstName);
  const [lastName, setLastName] = useState(scanner.user.lastName);
  const [eventId, setEventId] = useState(scanner.event.id);
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const inputCls = 'w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors';
  const labelCls = 'text-xs text-white/40 uppercase tracking-widest block mb-1.5';

  const handleSave = () => {
    const payload: Record<string, unknown> = {};
    if (firstName !== scanner.user.firstName) payload.firstName = firstName;
    if (lastName !== scanner.user.lastName) payload.lastName = lastName;
    if (eventId !== scanner.event.id) payload.eventId = eventId;
    if (newPassword.trim()) payload.newPassword = newPassword;
    onSave(scanner.id, payload);
  };

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
        className="glass-card p-6 w-full max-w-md border border-violet-neon/30"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bebas text-xl tracking-wider text-white">MODIFIER LE SCANNER</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
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

          <div>
            <label className={labelCls}>Téléphone</label>
            <input value={scanner.user.phone ?? ''} disabled className={`${inputCls} opacity-40 cursor-not-allowed`} />
            <p className="text-xs text-white/20 mt-1">Le téléphone sert d'identifiant de connexion — non modifiable</p>
          </div>

          <div>
            <label className={labelCls}>Événement assigné</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className={inputCls}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Nouveau mot de passe <span className="text-white/20">(laisser vide = inchangé)</span></label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 caractères"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">Annuler</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isLoading}
            className="flex-1"
          >
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

  // Actions en masse — Users
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Actions en masse — Remboursements commandes
  const [selectedRefundIds, setSelectedRefundIds] = useState<Set<string>>(new Set());

  // Actions en masse — Remboursements billets
  const [selectedTicketRefundIds, setSelectedTicketRefundIds] = useState<Set<string>>(new Set());

  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
  const [revisionTarget, setRevisionTarget] = useState<{ id: string; title: string } | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [scannerForm, setScannerForm] = useState({ firstName: '', lastName: '', phone: '', password: '', eventId: '' });
  const [showScannerForm, setShowScannerForm] = useState(false);
  const [showScannerPassword, setShowScannerPassword] = useState(false);
  const [createdScannerCreds, setCreatedScannerCreds] = useState<{ phone: string; password: string } | null>(null);
  const [editingScanner, setEditingScanner] = useState<ScannerRow | null>(null);
  const qc = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useQuery('admin-dashboard', async () => {
    const { data } = await api.get('/admin/dashboard');
    return data.data;
  }, { enabled: tab === 'dashboard' });

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
        qc.invalidateQueries('admin-dashboard');
        toast.success('Modifications approuvées et appliquées');
      },
      onError: () => toast.error('Erreur lors de l\'approbation'),
    }
  );

  const rejectEventChanges = useMutation(
    async ({ eventId, adminNote }: { eventId: string; adminNote?: string }) => {
      await api.patch(`/admin/events/${eventId}/reject-changes`, { adminNote });
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-events-pending-changes');
        toast.success('Modifications refusées');
      },
      onError: () => toast.error('Erreur lors du refus'),
    }
  );

  const [rejectChangesTarget, setRejectChangesTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: payoutsData, isLoading: payoutsLoading, refetch: refetchPayouts } = useQuery(
    'admin-payouts',
    async () => {
      const { data } = await api.get('/admin/payouts');
      return data.data as AdminPayoutOrganizer[];
    },
    { enabled: tab === 'payouts', staleTime: 0 }
  );

  const [payoutFormOrgId, setPayoutFormOrgId] = useState<string | null>(null);
  const [payoutForm, setPayoutForm] = useState({ amountSent: '', mobileMoney: '', operator: 'AIRTEL_MONEY', transactionRef: '', noteAdmin: '' });

  const createPayout = useMutation(
    async ({ organizerId, ...body }: { organizerId: string; amountSent: string; mobileMoney: string; operator: string; transactionRef: string; noteAdmin: string }) => {
      await api.post(`/admin/payouts/${organizerId}`, { ...body, amountSent: Number(body.amountSent) });
    },
    {
      onSuccess: () => {
        refetchPayouts();
        setPayoutFormOrgId(null);
        setPayoutForm({ amountSent: '', mobileMoney: '', operator: 'AIRTEL_MONEY', transactionRef: '', noteAdmin: '' });
        toast.success('Virement enregistré — notification envoyée à l\'organisateur');
      },
      onError: () => toast.error('Erreur lors de l\'enregistrement'),
    }
  );

  const { data: payoutSchedules, refetch: refetchSchedules } = useQuery(
    'admin-payout-schedules',
    async () => {
      const { data } = await api.get('/admin/payout-schedules');
      return data.data as AdminPayoutSchedule[];
    },
    { enabled: tab === 'payouts', staleTime: 0 }
  );

  const releaseSchedule = useMutation(
    async ({ scheduleId, transactionRef }: { scheduleId: string; transactionRef?: string }) => {
      await api.post(`/admin/payout-schedules/${scheduleId}/release`, { transactionRef });
    },
    {
      onSuccess: () => {
        refetchSchedules();
        refetchPayouts();
        toast.success('Tranche libérée — notification envoyée à l\'organisateur');
      },
      onError: (err: { response?: { data?: { message?: string } } }) =>
        toast.error(err?.response?.data?.message ?? 'Erreur lors de la libération'),
    }
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
      onError: () => toast.error('Erreur lors de la mise à jour du tier'),
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
      onSuccess: () => { qc.invalidateQueries('admin-events'); qc.invalidateQueries('admin-events-completed'); qc.invalidateQueries('admin-dashboard'); toast.success('Statut mis à jour'); },
      onError: () => toast.error('Erreur lors de la mise à jour'),
    }
  );

  const toggleUser = useMutation(
    async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/admin/users/${id}`, { isActive });
    },
    {
      onSuccess: () => { qc.invalidateQueries(['admin-users', userRoleFilter]); toast.success('Utilisateur mis à jour'); },
      onError: () => toast.error('Erreur'),
    }
  );

  const approveOrganizer = useMutation(
    async ({ organizerId, isApproved }: { organizerId: string; isApproved: boolean }) => {
      await api.patch(`/admin/organizers/${organizerId}/approve`, { isApproved });
    },
    {
      onSuccess: () => { qc.invalidateQueries(['admin-users', userRoleFilter]); qc.invalidateQueries('admin-payouts'); toast.success('Statut organisateur mis à jour'); },
      onError: () => toast.error('Erreur'),
    }
  );

  const certifyOrganizer = useMutation(
    async ({ organizerId, isCertified }: { organizerId: string; isCertified: boolean }) => {
      await api.patch(`/admin/organizers/${organizerId}/certify`, { isCertified });
    },
    {
      onSuccess: (_, { isCertified }) => { qc.invalidateQueries(['admin-users', userRoleFilter]); toast.success(isCertified ? 'Organisateur certifié' : 'Certification retirée'); },
      onError: () => toast.error('Erreur'),
    }
  );

  const certifyEvent = useMutation(
    async ({ eventId, isCertified }: { eventId: string; isCertified: boolean }) => {
      await api.patch(`/admin/events/${eventId}/certify`, { isCertified });
    },
    {
      onSuccess: (_, { isCertified }) => { qc.invalidateQueries('admin-events'); toast.success(isCertified ? 'Événement certifié' : 'Certification retirée'); },
      onError: () => toast.error('Erreur'),
    }
  );

  const { data: vitrineData, isLoading: vitrineLoading } = useQuery('admin-vitrine', async () => {
    const { data } = await api.get('/admin/events?status=PUBLISHED&limit=50');
    return data.data;
  }, { enabled: tab === 'vitrine' });

  const updateFlags = useMutation(
    async ({ id, isFeatured, isHot }: { id: string; isFeatured?: boolean; isHot?: boolean }) => {
      await api.patch(`/admin/events/${id}/flags`, { isFeatured, isHot });
    },
    {
      onSuccess: () => { qc.invalidateQueries('admin-vitrine'); toast.success('Mise en avant mise à jour'); },
      onError: () => toast.error('Erreur'),
    }
  );

  const cancelEvent = useMutation(
    async (id: string) => {
      await api.patch(`/admin/events/${id}/status`, { status: 'CANCELLED' });
    },
    {
      onSuccess: () => { qc.invalidateQueries('admin-vitrine'); qc.invalidateQueries('admin-dashboard'); toast.success('Événement retiré de la vitrine'); },
      onError: () => toast.error('Erreur'),
    }
  );

  const { data: scannersData, isLoading: scannersLoading } = useQuery('admin-scanners', async () => {
    const { data } = await api.get('/admin/scanners');
    return data.data as ScannerRow[];
  });

  const { data: publishedEventsData } = useQuery('admin-published-events', async () => {
    const { data } = await api.get('/admin/events?status=PUBLISHED&limit=100');
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
      onError: () => toast.error('Erreur'),
    }
  );

  const createScanner = useMutation(
    async (payload: typeof scannerForm) => {
      const { data } = await api.post('/admin/scanners/create-account', payload);
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
        setScannerForm({ firstName: '', lastName: '', phone: '', password: '', eventId: '' });
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
      onError: () => toast.error('Erreur lors du traitement'),
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
    () => api.get('/admin/settings').then((r) => r.data.data as { freeTicketFee: number; updatedAt: string }),
    { enabled: tab === 'settings', staleTime: 0 }
  );
  const [freeTicketFeeInput, setFreeTicketFeeInput] = useState('');
  const updateConfigMutation = useMutation(
    (payload: { freeTicketFee: number }) => api.patch('/admin/settings', payload).then((r) => r.data),
    {
      onSuccess: () => {
        toast.success('Configuration mise à jour');
        qc.invalidateQueries('admin-platform-config');
        setFreeTicketFeeInput('');
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
      onError: () => toast.error('Erreur lors de l\'anonymisation'),
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
      onError: () => toast.error('Erreur lors du traitement'),
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
      onError: () => toast.error('Erreur lors de l\'action en masse'),
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
      onError: () => toast.error('Erreur lors de l\'action en masse'),
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
      onError: () => toast.error('Erreur lors de l\'action en masse'),
    }
  );

  const TABS = [
    { key: 'dashboard' as TabType, label: 'Dashboard', Icon: LayoutDashboard },
    { key: 'events' as TabType, label: 'Validation', Icon: ListChecks, badge: dashboard?.pendingEvents },
    { key: 'vitrine' as TabType, label: 'Vitrine', Icon: Sparkles },
    { key: 'scanners' as TabType, label: 'Scanners', Icon: ScanLine, badge: scannersData?.length },
    { key: 'users' as TabType, label: 'Utilisateurs', Icon: Users },
    { key: 'payouts' as TabType, label: 'Virements', Icon: Banknote, badge: payoutsData?.length },
    { key: 'refunds' as TabType, label: 'Remboursements', Icon: RotateCcw, badge: ((refundsData?.filter((r: { refundStatus: string }) => r.refundStatus === 'REQUESTED').length ?? 0) + (ticketRefundsData?.filter((r: { refundStatus: string }) => r.refundStatus === 'REQUESTED').length ?? 0)) || undefined },
    { key: 'audit' as TabType, label: 'Audit', Icon: ScrollText },
    { key: 'settings' as TabType, label: 'Paramètres', Icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-bebas text-5xl tracking-wider text-gradient leading-none">BACK-OFFICE ADMIN</h1>
            <p className="text-white/40 text-xs mt-1">{user?.firstName} {user?.lastName}</p>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-rose-neon hover:border-rose-neon/30 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
        <p className="text-white/40 mt-1 text-sm">Gestion de la plateforme BilletGo</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-violet-neon/20 pb-4 overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label, Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? 'bg-neon-gradient text-white shadow-neon' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {(badge ?? 0) > 0 && (
              <span className="min-w-5 h-5 px-1 bg-rose-neon rounded-full text-xs flex items-center justify-center text-white font-bold">
                {(badge ?? 0) > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Dashboard tab ── */}
      {tab === 'dashboard' && (
        dashLoading ? (
          <div className="space-y-6">
            <SkeletonKpiGrid count={4} />
            <SkeletonKpiGrid count={3} />
          </div>
        ) :
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Utilisateurs" value={dashboard?.totalUsers ?? 0} Icon={Users} color="violet" />
            <KpiCard title="Organisateurs" value={dashboard?.totalOrganizers ?? 0} Icon={ShieldAlert} color="cyan" />
            <KpiCard title="Événements publiés" value={dashboard?.totalEvents ?? 0} Icon={CalendarDays} color="violet" />
            <KpiCard title="En attente" value={dashboard?.pendingEvents ?? 0} subtitle="Validation requise" Icon={Clock} color="rose" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard title="Commandes complètes" value={(dashboard?.totalOrders ?? 0).toLocaleString('fr-FR')} Icon={CheckCircle} color="green" />
            <KpiCard title="Revenus plateforme" value={formatPrice(dashboard?.platformRevenue ?? 0, 'FCFA', '0 FCFA')} subtitle="Commission BilletGo" Icon={TrendingUp} color="rose" />
            <KpiCard title="Volume transactions" value={formatPrice(dashboard?.totalTransactionVolume ?? 0, 'FCFA', '0 FCFA')} subtitle="Total brut" Icon={TrendingUp} color="cyan" />
          </div>
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
                    {event.offer && (
                      <span className="flex items-center gap-1">
                        Forfait :
                        <span className={`font-semibold ${event.offer === 'PREMIUM' ? 'text-rose-neon' : event.offer === 'INTERMEDIAIRE' ? 'text-yellow-400' : 'text-cyan-neon'}`}>
                          {event.offer as string}
                        </span>
                        <span className="text-white/60 font-mono">
                          ({Math.round(Number(event.commissionRate) * 100)}% commission)
                        </span>
                      </span>
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
                <div className="flex md:flex-col gap-2 flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 md:flex-none flex items-center gap-1.5"
                    onClick={() => updateStatus.mutate({ id: event.id as string, status: 'APPROVED' })}
                    isLoading={updateStatus.isLoading}
                  >
                    <CheckCircle className="w-4 h-4" /> Approuver
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 md:flex-none flex items-center gap-1.5 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
                    onClick={() => setRevisionTarget({ id: event.id as string, title: event.title as string })}
                  >
                    <MessageSquare className="w-4 h-4" /> Révision
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1 md:flex-none flex items-center gap-1.5"
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

                      <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
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
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-cyan-neon border border-cyan-neon/20 hover:bg-cyan-neon/10"
                            onClick={() => updateStatus.mutate({ id: event.id as string, status: 'PUBLISHED' })}
                            isLoading={updateStatus.isLoading && updateStatus.variables?.id === event.id}
                          >
                            Republier
                          </Button>
                        </div>
                      </div>
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
          <div className="flex items-center gap-3 mb-6 p-4 glass-card border border-violet-neon/20">
            <div className="flex items-center gap-4 text-xs text-white/50 flex-wrap">
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-400" /> À la une — apparaît en hero (1 seul à la fois)</span>
              <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-rose-neon" /> HOT — badge flamme sur la carte + section Tendances</span>
              <span className="flex items-center gap-1.5"><Ban className="w-3.5 h-3.5 text-white/30" /> Retirer — masque l'événement du site</span>
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
            return (

              <motion.div
                key={ev.id as string}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
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
                  <p className="text-white/40 text-xs">{org?.companyName as string} · {formatEventDate(ev.eventDate as string)}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 flex-shrink-0">
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
                    variant="danger"
                    size="sm"
                    onClick={() => cancelEvent.mutate(ev.id as string)}
                    isLoading={cancelEvent.isLoading}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Retirer
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Users tab ── */}
      {tab === 'users' && (
        <div>
          {/* Role filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {['', 'BUYER', 'ORGANIZER', 'SCANNER', 'ADMIN'].map((r) => (
              <button
                key={r}
                onClick={() => setUserRoleFilter(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
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
                    <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                      <th className="px-5 py-3 w-10">
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
                            ? <CheckSquare className="w-4 h-4 text-violet-neon" />
                            : <Square className="w-4 h-4" />
                          }
                        </button>
                      </th>
                      <th className="text-left px-5 py-3">Utilisateur</th>
                      <th className="text-left px-5 py-3">Rôle</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Téléphone</th>
                      <th className="text-left px-5 py-3 hidden sm:table-cell">Inscription</th>
                      <th className="text-center px-5 py-3">Statut</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {(usersData?.users ?? []).map((u: Record<string, unknown>) => (
                      <tr key={u.id as string} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 w-10">
                          {(u.role as string) !== 'ADMIN' && (
                            <button
                              onClick={() => {
                                const id = u.id as string;
                                setSelectedUserIds((prev) => {
                                  const next = new Set(prev);
                                  next.has(id) ? next.delete(id) : next.add(id);
                                  return next;
                                });
                              }}
                              className="text-white/30 hover:text-violet-neon transition-colors"
                            >
                              {selectedUserIds.has(u.id as string)
                                ? <CheckSquare className="w-4 h-4 text-violet-neon" />
                                : <Square className="w-4 h-4" />
                              }
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-white font-semibold">{u.firstName as string} {u.lastName as string}</p>
                          <p className="text-white/40 text-xs">{u.email as string}</p>
                          {(u.role as string) === 'ORGANIZER' && (u as Record<string, unknown>).organizer && (
                            <p className="text-violet-neon/70 text-xs mt-0.5">
                              {((u as Record<string, unknown>).organizer as Record<string, unknown>).companyName as string}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge role={u.role as string} />
                        </td>
                        <td className="px-5 py-4 text-white/50 text-xs hidden md:table-cell">
                          {(u.phone as string) || '—'}
                        </td>
                        <td className="px-5 py-4 text-white/40 text-xs hidden sm:table-cell">
                          {new Date(u.createdAt as string).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {u.isActive ? (
                              <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 font-semibold">Actif</span>
                            ) : (
                              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-neon/20 text-rose-neon font-semibold">Bloqué</span>
                            )}
                            {(u.role as string) === 'ORGANIZER' && (u as Record<string, unknown>).organizer && (
                              ((u as Record<string, unknown>).organizer as Record<string, unknown>).isApproved ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-neon/10 text-cyan-neon font-semibold">Approuvé</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 font-semibold">Non approuvé</span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            {(u.role as string) !== 'ADMIN' && (
                              <>
                                <Button
                                  variant={u.isActive ? 'danger' : 'secondary'}
                                  size="sm"
                                  onClick={() => toggleUser.mutate({ id: u.id as string, isActive: !u.isActive })}
                                  isLoading={toggleUser.isLoading}
                                >
                                  {u.isActive ? 'Bloquer' : 'Activer'}
                                </Button>
                                {(u.firstName as string) !== 'Compte' && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Anonymiser ${u.firstName} ${u.lastName} ? Cette action est irréversible.`)) {
                                        anonymizeUserMutation.mutate(u.id as string);
                                      }
                                    }}
                                    className="text-xs text-white/25 hover:text-rose-neon transition-colors whitespace-nowrap"
                                  >
                                    Anonymiser (RGPD)
                                  </button>
                                )}
                              </>
                            )}
                            {(u.role as string) === 'ORGANIZER' && (u as Record<string, unknown>).organizer && (() => {
                              const org = (u as Record<string, unknown>).organizer as Record<string, unknown>;
                              return (
                                <>
                                  {org.kycDocumentUrl && (() => {
                                    const url = org.kycDocumentUrl as string;
                                    return (
                                      <a
                                        href={/\.(jpg|jpeg|png|webp)$/i.test(url) || url.includes('/image/upload/') ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-neon/10 text-violet-neon text-xs font-semibold border border-violet-neon/20 hover:bg-violet-neon/20 transition-colors whitespace-nowrap"
                                      >
                                        <FileSearch className="w-3.5 h-3.5" />
                                        KYC
                                      </a>
                                    );
                                  })()}
                                  {!org.kycDocumentUrl && (
                                    <span className="text-xs text-white/25 italic">Pas de KYC</span>
                                  )}
                                  <Button
                                    variant={org.isApproved ? 'danger' : 'primary'}
                                    size="sm"
                                    onClick={() => approveOrganizer.mutate({
                                      organizerId: org.id as string,
                                      isApproved: !org.isApproved,
                                    })}
                                    isLoading={approveOrganizer.isLoading}
                                  >
                                    {org.isApproved ? 'Désapprouver' : 'Approuver'}
                                  </Button>
                                  <Button
                                    variant={org.isCertified ? 'danger' : 'secondary'}
                                    size="sm"
                                    onClick={() => certifyOrganizer.mutate({
                                      organizerId: org.id as string,
                                      isCertified: !org.isCertified,
                                    })}
                                    isLoading={certifyOrganizer.isLoading}
                                  >
                                    {org.isCertified ? 'Retirer certif.' : 'Certifier'}
                                  </Button>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-white/5 text-xs text-white/30">
                {usersData?.total ?? 0} utilisateur{(usersData?.total ?? 0) > 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Barre d'actions en masse */}
          {selectedUserIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 glass-card px-5 py-3 border border-violet-neon/30 shadow-neon rounded-2xl">
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

      {/* ── Payouts tab ── */}
      {tab === 'payouts' && (
        payoutsLoading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => <SkeletonCard key={i} lines={5} />)}
          </div>
        ) :
        <div className="space-y-6">
          {/* ── Planning de versements éligibles ── */}
          {(payoutSchedules ?? []).filter((s) => s.isEligible && s.status === 'PENDING').length > 0 && (
            <div className="space-y-3">
              <h2 className="font-bebas text-2xl tracking-wider text-yellow-400 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Tranches éligibles au versement
              </h2>
              {(payoutSchedules ?? []).filter((s) => s.isEligible && s.status === 'PENDING').map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 border border-yellow-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-white/40 truncate">{s.organizer.companyName}</p>
                    <p className="text-sm font-semibold text-white">
                      {s.event.title} — Tranche {s.tranche} (jusqu'à {Math.round(s.percentage * 100)}% des ventes)
                    </p>
                    <p className="text-xs text-white/30 mt-0.5 font-mono">
                      Prévu : {new Date(s.scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {s.organizer.mobileMoneyNumber && <> · {s.organizer.mobileMoneyNumber}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {s.totalOrganizerAmount > 0 ? (
                      <p className="font-mono font-bold text-yellow-400 text-base">{formatPrice(s.trancheAmount, 'FCFA')}</p>
                    ) : (
                      <p className="text-xs text-white/30">Aucune vente</p>
                    )}
                    {s.totalOrganizerAmount > 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={releaseSchedule.isLoading}
                        onClick={() => releaseSchedule.mutate({ scheduleId: s.id })}
                      >
                        <CheckCircle className="w-4 h-4" /> Libérer
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Organisateurs ── */}
        <div className="space-y-4">
          {!payoutsData?.length ? (
            <div className="glass-card p-16 text-center">
              <Banknote className="w-12 h-12 text-green-400/20 mx-auto mb-3" />
              <p className="text-white/40">Aucun organisateur actif</p>
            </div>
          ) : payoutsData.map((org) => (
            <motion.div
              key={org.organizerId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden border border-white/5"
            >
              {/* En-tête organisateur */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-bebas text-xl tracking-wide text-white">{org.companyName}</h3>
                    {/* Tier badge */}
                    {(() => {
                      const tierMap: Record<string, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
                        NEW:       { label: 'Nouveau',  color: 'text-white/40',    Icon: Star   },
                        APPROVED:  { label: 'Approuvé', color: 'text-cyan-neon',   Icon: Shield },
                        CERTIFIED: { label: 'Certifié', color: 'text-violet-neon', Icon: Award  },
                        PREMIUM:   { label: 'Premium',  color: 'text-yellow-400',  Icon: Zap    },
                      };
                      const isPremium   = org.isPremium;
                      const isCertified = org.isCertified;
                      const isApproved  = org.isApproved;
                      const tier = isPremium ? 'PREMIUM' : isCertified ? 'CERTIFIED' : isApproved ? 'APPROVED' : 'NEW';
                      const meta = tierMap[tier];
                      const { Icon } = meta;
                      return (
                        <span className={`flex items-center gap-1 text-xs font-semibold ${meta.color}`}>
                          <Icon className="w-3 h-3" /> {meta.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">
                    {org.user.firstName} {org.user.lastName}
                    {org.user.phone && <span className="ml-2 font-mono text-cyan-neon/70">{org.user.phone}</span>}
                  </p>
                  {org.mobileMoneyNumber
                    ? <p className="flex items-center gap-1 text-xs text-cyan-neon mt-1"><Phone className="w-3 h-3" /> {org.mobileMoneyNumber}</p>
                    : <p className="text-xs text-rose-neon/60 mt-1">Numéro Mobile Money non renseigné</p>
                  }
                  {/* Tier selector */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <p className="text-xs text-white/30">Tier :</p>
                    {[
                      { key: 'APPROVED',  label: 'Approuvé', flags: { isApproved: true,  isCertified: false, isPremium: false } },
                      { key: 'CERTIFIED', label: 'Certifié', flags: { isApproved: true,  isCertified: true,  isPremium: false } },
                      { key: 'PREMIUM',   label: 'Premium',  flags: { isApproved: true,  isCertified: true,  isPremium: true  } },
                    ].map((t) => {
                      const currentTier = org.isPremium ? 'PREMIUM' : org.isCertified ? 'CERTIFIED' : org.isApproved ? 'APPROVED' : 'NEW';
                      const isActive = currentTier === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => !isActive && updateOrgTier.mutate({ organizerId: org.organizerId, ...t.flags })}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${isActive ? 'bg-violet-neon/20 text-violet-neon border border-violet-neon/30' : 'text-white/30 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Soldes */}
                <div className="flex flex-wrap sm:flex-nowrap gap-3 flex-shrink-0">
                  {[
                    { label: 'Collecté', val: formatPrice(org.totalCollected, 'FCFA', '0 FCFA'), color: 'text-white/70' },
                    { label: 'Net org.', val: formatPrice(org.totalNetAmount, 'FCFA', '0 FCFA'), color: 'text-cyan-neon' },
                    { label: 'Déjà viré', val: formatPrice(org.totalPaid, 'FCFA', '0 FCFA'), color: 'text-green-400' },
                    { label: 'Restant', val: formatPrice(org.balanceDue, 'FCFA', '0 FCFA'), color: org.balanceDue > 0 ? 'text-yellow-400' : 'text-white/30' },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-white/[0.04] rounded-xl px-3 py-2 min-w-[80px]">
                      <p className="text-xs text-white/30 uppercase tracking-widest mb-0.5">{s.label}</p>
                      <p className={`font-mono font-bold text-sm ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Événements */}
              {org.events.length > 0 && (
                <div className="border-t border-white/5 px-5 py-3 flex flex-wrap gap-2">
                  {org.events.map((ev) => (
                    <span key={ev.id} className="text-xs bg-white/[0.04] border border-white/10 rounded-full px-3 py-1 text-white/50">{ev.title}</span>
                  ))}
                </div>
              )}

              {/* Historique virements */}
              {org.payoutHistory.length > 0 && (
                <div className="border-t border-white/5 px-5 py-3 space-y-2">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Virements effectués</p>
                  {org.payoutHistory.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs bg-white/[0.03] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="font-mono font-bold text-green-400">{formatPrice(p.amountSent)}</span>
                        <span className="text-white/30">{p.operator} · {p.mobileMoney}</span>
                        {p.transactionRef && <span className="font-mono text-white/20">#{p.transactionRef}</span>}
                      </div>
                      <div className="text-right text-white/25">
                        <div>{new Date(p.processedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div>par {p.processedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire de virement */}
              <div className="border-t border-white/5 p-5">
                {payoutFormOrgId === org.organizerId ? (
                  <div className="space-y-3">
                    <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Enregistrer un nouveau virement</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Montant (FCFA) <span className="text-rose-neon">*</span></label>
                        <input
                          type="number"
                          value={payoutForm.amountSent}
                          onChange={(e) => setPayoutForm((f) => ({ ...f, amountSent: e.target.value }))}
                          placeholder={`Suggestion : ${formatPrice(org.balanceDue)}`}
                          className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-neon transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Numéro Mobile Money <span className="text-rose-neon">*</span></label>
                        <input
                          type="tel"
                          value={payoutForm.mobileMoney}
                          onChange={(e) => setPayoutForm((f) => ({ ...f, mobileMoney: e.target.value }))}
                          placeholder={org.mobileMoneyNumber ?? 'Ex: 074000000'}
                          className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-neon transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Opérateur <span className="text-rose-neon">*</span></label>
                        <select
                          value={payoutForm.operator}
                          onChange={(e) => setPayoutForm((f) => ({ ...f, operator: e.target.value }))}
                          className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-neon transition-colors"
                        >
                          <option value="AIRTEL_MONEY">Airtel Money</option>
                          <option value="MOOV_MONEY">Moov Money</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Référence transaction</label>
                        <input
                          value={payoutForm.transactionRef}
                          onChange={(e) => setPayoutForm((f) => ({ ...f, transactionRef: e.target.value }))}
                          placeholder="Ex: TXN-XXXXX (optionnel)"
                          className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-neon transition-colors"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Note admin</label>
                        <input
                          value={payoutForm.noteAdmin}
                          onChange={(e) => setPayoutForm((f) => ({ ...f, noteAdmin: e.target.value }))}
                          placeholder="Ex: Versement post-événement (optionnel)"
                          className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-neon transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={createPayout.isLoading}
                        onClick={() => createPayout.mutate({ organizerId: org.organizerId, ...payoutForm })}
                        disabled={!payoutForm.amountSent || !payoutForm.mobileMoney}
                      >
                        <CheckCircle className="w-4 h-4" /> Confirmer le virement
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setPayoutFormOrgId(null)}>
                        <X className="w-4 h-4" /> Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPayoutFormOrgId(org.organizerId);
                      setPayoutForm((f) => ({ ...f, mobileMoney: org.mobileMoneyNumber ?? '' }));
                    }}
                  >
                    <Banknote className="w-4 h-4" /> Enregistrer un virement
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        </div>
      )}

      {/* ── Scanners tab ── */}
      {tab === 'scanners' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-white/40 text-sm">Créez des comptes scanner et assignez-les à un événement.</p>
            <Button variant="secondary" size="sm" onClick={() => { setShowScannerForm((v) => !v); setCreatedScannerCreds(null); }}>
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
                  {[
                    { label: 'Prénom', field: 'firstName', placeholder: 'Jean', type: 'text' },
                    { label: 'Nom', field: 'lastName', placeholder: 'Mbadinga', type: 'text' },
                    { label: 'Téléphone', field: 'phone', placeholder: '07 00 00 00', type: 'tel' },
                    { label: 'Mot de passe', field: 'password', placeholder: 'Min. 8 caractères', type: 'password' },
                  ].map(({ label, field, placeholder, type }) => (
                    <div key={field}>
                      <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">{label}</label>
                      <input
                        type={type}
                        value={scannerForm[field as keyof typeof scannerForm]}
                        onChange={(e) => setScannerForm((f) => ({ ...f, [field]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Événement</label>
                    <select
                      value={scannerForm.eventId}
                      onChange={(e) => setScannerForm((f) => ({ ...f, eventId: e.target.value }))}
                      className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-neon transition-colors"
                    >
                      <option value="">Sélectionner un événement publié...</option>
                      {(publishedEventsData ?? []).map((ev: Record<string, unknown>) => (
                        <option key={ev.id as string} value={ev.id as string}>{ev.title as string}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => createScanner.mutate(scannerForm)}
                      isLoading={createScanner.isLoading}
                      disabled={!scannerForm.firstName || !scannerForm.lastName || !scannerForm.phone || !scannerForm.password || !scannerForm.eventId}
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
                      <th className="text-left px-5 py-3">Téléphone</th>
                      <th className="text-left px-5 py-3">Événement</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Organisateur</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Date événement</th>
                      <th className="text-center px-5 py-3">Statut</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {scannersData.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 text-white font-semibold">{s.user.firstName} {s.user.lastName}</td>
                        <td className="px-5 py-4 text-white/60 text-xs font-mono">{s.user.phone || '—'}</td>
                        <td className="px-5 py-4 text-white/80 max-w-[180px] truncate">{s.event.title}</td>
                        <td className="px-5 py-4 text-white/40 text-xs hidden md:table-cell">{s.event.organizer?.companyName}</td>
                        <td className="px-5 py-4 text-white/40 text-xs hidden md:table-cell">{formatEventDate(s.event.eventDate)}</td>
                        <td className="px-5 py-4 text-center">
                          {s.isActive ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 font-semibold">Actif</span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-neon/20 text-rose-neon font-semibold">Bloqué</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant={s.isActive ? 'danger' : 'secondary'}
                              size="sm"
                              onClick={() => toggleScannerMutation.mutate({ id: s.id, isActive: !s.isActive })}
                              isLoading={toggleScannerMutation.isLoading}
                            >
                              {s.isActive ? 'Bloquer' : 'Activer'}
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
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 glass-card px-5 py-3 border border-violet-neon/30 shadow-neon rounded-2xl">
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
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 glass-card px-5 py-3 border border-violet-neon/30 shadow-neon rounded-2xl">
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
              className="bg-bg-card border border-violet-neon/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-violet-neon transition-colors text-sm w-52"
            />
            <input
              value={auditEntityFilter}
              onChange={(e) => { setAuditEntityFilter(e.target.value); setAuditPage(1); }}
              placeholder="Filtrer par entité..."
              className="bg-bg-card border border-violet-neon/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-violet-neon transition-colors text-sm w-52"
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
            <div className="grid grid-cols-3 gap-3">
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
              <div className="flex items-end gap-4">
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

        </div>
      )}

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

    </div>
  );
}
