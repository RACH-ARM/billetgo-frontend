import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { organizerService } from '../services/organizerService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Bell, Trash2, Camera, ChevronLeft,
  Check, AlertTriangle, Building2, Clock,
  Ticket, CalendarDays, ExternalLink, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import {
  useMe, useUpdateMe, useChangePassword, useUploadAvatar,
  useMyWaitlist, useUpdateNotifications, useDeleteAccount,
  useUpdateOrganizerProfile, useUploadOrganizerLogo,
} from '../hooks/useProfile';
import { useMyOrders } from '../hooks/useTickets';
import { formatPrice } from '../utils/formatPrice';
import { formatEventDate } from '../utils/formatDate';
import Spinner from '../components/common/Spinner';

// ── Helpers ───────────────────────────────────────────────────

const TABS_BY_ROLE: Record<string, { id: string; label: string }[]> = {
  BUYER: [
    { id: 'profil',    label: 'Mon profil' },
    { id: 'commandes', label: 'Mes commandes' },
    { id: 'attente',   label: 'Listes d\'attente' },
    { id: 'securite',  label: 'Sécurité' },
  ],
  ORGANIZER: [
    { id: 'profil',      label: 'Mon profil' },
    { id: 'organisateur', label: 'Profil organisateur' },
    { id: 'securite',    label: 'Sécurité' },
  ],
  SCANNER: [
    { id: 'profil',   label: 'Mon profil' },
    { id: 'securite', label: 'Sécurité' },
  ],
  ADMIN: [
    { id: 'profil',   label: 'Mon profil' },
    { id: 'securite', label: 'Sécurité' },
  ],
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Confirmée',
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  FAILED: 'Échouée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'text-green-400',
  PENDING: 'text-yellow-400',
  PROCESSING: 'text-yellow-400',
  FAILED: 'text-rose-neon',
  CANCELLED: 'text-rose-neon',
  REFUNDED: 'text-white/40',
};

// ── Composant champ formulaire ────────────────────────────────

function Field({
  label, value, onChange, type = 'text', placeholder, optional, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">
        {label}{optional && <span className="text-white/20 ml-1">(optionnel)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-neon/50 transition-colors placeholder:text-white/20"
      />
      {hint && <p className="text-xs text-white/30 mt-1">{hint}</p>}
    </div>
  );
}

function TextArea({
  label, value, onChange, placeholder, rows = 3, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-neon/50 transition-colors placeholder:text-white/20 resize-none"
      />
      {hint && <p className="text-xs text-white/30 mt-1">{hint}</p>}
    </div>
  );
}

// ── Onglet Profil ─────────────────────────────────────────────

function TabProfil() {
  const { data: me, isLoading } = useMe();
  const updateMe = useUpdateMe();
  const uploadAvatar = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [dirty, setDirty]         = useState(false);

  useEffect(() => {
    if (!me || dirty) return;
    setFirstName(me.firstName);
    setLastName(me.lastName);
    setEmail(me.email ?? '');
    setPhone(me.phone ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const handleChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateMe.mutateAsync({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
      setDirty(false);
      toast.success('Profil mis à jour');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erreur lors de la mise à jour');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success('Photo de profil mise à jour');
    } catch {
      toast.error('Erreur lors de l\'upload');
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          {me?.avatarUrl ? (
            <img
              src={me.avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-neon/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-violet-neon/20 border-2 border-violet-neon/30 flex items-center justify-center">
              <span className="font-bebas text-2xl text-violet-neon tracking-widest">{initials || '?'}</span>
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadAvatar.isLoading}
            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-violet-neon flex items-center justify-center hover:bg-violet-neon/80 transition-colors"
          >
            {uploadAvatar.isLoading ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-white" />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-white font-semibold text-base">{me?.firstName} {me?.lastName}</p>
          <p className="text-white/40 text-sm mt-0.5">{me?.email ?? me?.phone ?? '—'}</p>
          <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-lg bg-violet-neon/10 text-violet-neon border border-violet-neon/20">
            {me?.role}
          </span>
        </div>
      </div>

      {/* Formulaire */}
      <div className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prénom" value={firstName} onChange={handleChange(setFirstName)} placeholder="Votre prénom" hint="Affiché sur vos billets" />
          <Field label="Nom" value={lastName} onChange={handleChange(setLastName)} placeholder="Votre nom" hint="Affiché sur vos billets" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" type="email" value={email} onChange={handleChange(setEmail)} placeholder="votre@email.com" optional hint="Pour recevoir vos confirmations d'achat" />
          <Field label="Téléphone" value={phone} onChange={handleChange(setPhone)} placeholder="+241 xx xxx xxx" optional hint="Votre numéro WhatsApp pour recevoir vos billets" />
        </div>

        {dirty && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={updateMe.isLoading}
              className="neon-button text-sm py-2 px-5"
            >
              {updateMe.isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Onglet Profil organisateur ────────────────────────────────

function TabOrganisateur() {
  const { data: me, isLoading } = useMe();
  const updateOrg = useUpdateOrganizerProfile();
  const uploadLogo = useUploadOrganizerLogo();
  const logoRef = useRef<HTMLInputElement>(null);

  const org = me?.organizer;

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite]         = useState('');
  const [mobileMoney, setMobileMoney] = useState('');
  const [dirty, setDirty]             = useState(false);

  useEffect(() => {
    if (!org || dirty) return;
    setCompanyName(org.companyName ?? '');
    setDescription(org.description ?? '');
    setWebsite(org.website ?? '');
    setMobileMoney(org.mobileMoneyNumber ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  const handleChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateOrg.mutateAsync({
        companyName: companyName.trim() || undefined,
        description: description.trim() || null,
        website: website.trim() || null,
        mobileMoneyNumber: mobileMoney.trim() || undefined,
      });
      setDirty(false);
      toast.success('Profil organisateur mis à jour');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erreur lors de la mise à jour');
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadLogo.mutateAsync(file);
      toast.success('Logo mis à jour');
    } catch {
      toast.error('Erreur lors de l\'upload');
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!org) return <p className="text-white/40 text-sm">Profil organisateur non trouvé.</p>;

  return (
    <div className="space-y-6">
      {/* Commission */}
      <div className="glass-card p-4 flex justify-end">
        <div className="text-xs text-white/30">
          Commission : {(Number(org.commissionRate) * 100).toFixed(0)}%
        </div>
      </div>

      {/* Logo */}
      <div className="glass-card p-6">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Logo de l'organisation</p>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white/20" />
              </div>
            )}
            <button
              onClick={() => logoRef.current?.click()}
              disabled={uploadLogo.isLoading}
              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-lg bg-violet-neon flex items-center justify-center hover:bg-violet-neon/80 transition-colors"
            >
              {uploadLogo.isLoading ? (
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3 text-white" />
              )}
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
          <p className="text-white/40 text-xs leading-relaxed">
            Format recommandé : carré, JPG ou PNG, max 10 Mo.
            Ce logo apparaît sur votre page publique d'organisateur.
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="glass-card p-6 space-y-4">
        <Field label="Nom de l'organisation" value={companyName} onChange={handleChange(setCompanyName)} placeholder="Nom de votre structure" hint="Nom affiché publiquement sur vos événements" />
        <TextArea label="Description" value={description} onChange={handleChange(setDescription)} placeholder="Décrivez votre organisation..." rows={4} hint="Visible sur votre page publique d'organisateur" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Site web" value={website} onChange={handleChange(setWebsite)} placeholder="https://monsite.com" optional hint="URL complète de votre site (ex: https://monsite.com)" />
          <Field label="Numéro Mobile Money" value={mobileMoney} onChange={handleChange(setMobileMoney)} placeholder="ex: 074123456" hint="Numéro sur lequel vous recevez vos reversements" />
        </div>

        {dirty && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={updateOrg.isLoading}
              className="neon-button text-sm py-2 px-5"
            >
              {updateOrg.isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Onglet Commandes ──────────────────────────────────────────

type OrderPreview = {
  id: string;
  status: string;
  totalAmount: string | number;
  event?: { title?: string; coverImageUrl?: string | null; eventDate?: string };
};

function TabCommandes() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading } = useMyOrders() as any;
  const orders: OrderPreview[] = data ?? [];

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  if (orders.length === 0) {
    return (
      <div className="glass-card p-10 flex flex-col items-center gap-3 text-center">
        <Ticket className="w-10 h-10 text-white/20" />
        <p className="text-white/40 text-sm">Aucune commande pour l'instant.</p>
        <Link to="/evenements" className="text-violet-neon text-sm hover:underline">Découvrir les événements</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.slice(0, 20).map((order) => (
        <div key={order.id} className="glass-card p-4 flex items-center gap-4">
          {order.event?.coverImageUrl ? (
            <img src={order.event.coverImageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <Ticket className="w-5 h-5 text-white/20" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{order.event?.title ?? 'Événement inconnu'}</p>
            <p className="text-white/40 text-xs mt-0.5">
              {order.event?.eventDate ? formatEventDate(order.event.eventDate) : '—'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-xs font-semibold ${ORDER_STATUS_COLOR[order.status] ?? 'text-white/40'}`}>
              {ORDER_STATUS_LABEL[order.status] ?? order.status}
            </p>
            <p className="text-white/60 text-xs mt-0.5">{formatPrice(Number(order.totalAmount))}</p>
          </div>
        </div>
      ))}
      <div className="text-center pt-2">
        <Link to="/mes-billets" className="text-violet-neon text-sm hover:underline inline-flex items-center gap-1">
          Voir tous mes billets <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ── Onglet Listes d'attente ───────────────────────────────────

function TabAttente() {
  const { data: waitlists, isLoading } = useMyWaitlist();

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  if (!waitlists || waitlists.length === 0) {
    return (
      <div className="glass-card p-10 flex flex-col items-center gap-3 text-center">
        <Clock className="w-10 h-10 text-white/20" />
        <p className="text-white/40 text-sm">Vous n'êtes inscrit sur aucune liste d'attente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {waitlists.map((entry) => (
        <div key={entry.id} className="glass-card p-4 flex items-center gap-4">
          {entry.event.coverImageUrl ? (
            <img src={entry.event.coverImageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-white/20" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{entry.event.title}</p>
            <p className="text-white/40 text-xs mt-0.5">
              {formatEventDate(entry.event.eventDate)} — {entry.event.venueName}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {entry.notified ? (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                Notifié
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                En attente
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Champ mot de passe avec toggle affichage ─────────────────

function PasswordField({
  label, value, onChange, placeholder, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-bg-secondary border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-white text-sm focus:outline-none focus:border-violet-neon/50 transition-colors placeholder:text-white/20"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-white/30 text-xs mt-1">{hint}</p>}
    </div>
  );
}

// ── Indicateur de force du mot de passe ───────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  const levels = [
    { label: 'Très faible', color: 'bg-rose-neon' },
    { label: 'Faible',      color: 'bg-orange-400' },
    { label: 'Moyen',       color: 'bg-yellow-400' },
    { label: 'Fort',        color: 'bg-green-400' },
    { label: 'Très fort',   color: 'bg-green-400' },
  ];
  const level = levels[score] ?? levels[0];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? level.color : 'bg-white/10'}`}
          />
        ))}
      </div>
      <p className="text-xs text-white/30">{level.label}</p>
    </div>
  );
}

// ── Onglet Sécurité ───────────────────────────────────────────

function TabSecurite() {
  const { data: me } = useMe();
  const changePwdMutation = useChangePassword();
  const updateNotifs      = useUpdateNotifications();
  const deleteAcc         = useDeleteAccount();
  const { logout }        = useAuthStore();
  const navigate          = useNavigate();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError]     = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const mismatch = confirmPwd.length > 0 && newPwd !== confirmPwd;

  const handleChangePassword = async () => {
    setPwdError(null);
    setPwdSuccess(false);

    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError('Tous les champs sont requis');
      return;
    }
    if (newPwd.length < 8) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPwd === currentPwd) {
      setPwdError('Le nouveau mot de passe doit être différent de l\'actuel');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await changePwdMutation.mutateAsync({ currentPassword: currentPwd, newPassword: newPwd });
      setPwdSuccess(true);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      toast.success('Mot de passe mis à jour');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPwdError(msg || 'Erreur lors du changement de mot de passe');
      // Vider uniquement le champ mot de passe actuel pour que l'utilisateur puisse réessayer
      setCurrentPwd('');
    }
  };

  const handleToggleNotifications = async () => {
    const newValue = !me?.notificationsEnabled;
    try {
      await updateNotifs.mutateAsync(newValue);
      toast.success(newValue ? 'Notifications activées' : 'Notifications désactivées');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') return toast.error('Tapez SUPPRIMER pour confirmer');
    try {
      await deleteAcc.mutateAsync();
      await logout();
      toast.success('Compte supprimé');
      navigate('/');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-violet-neon" />
            <div>
              <p className="text-white text-sm font-medium">Notifications</p>
              <p className="text-white/40 text-xs mt-0.5">Recevoir les confirmations, rappels et alertes</p>
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={updateNotifs.isLoading}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${me?.notificationsEnabled ? 'bg-violet-neon' : 'bg-white/10'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${me?.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Changer mot de passe */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-violet-neon" />
          <h3 className="text-white text-sm font-medium">Changer le mot de passe</h3>
        </div>

        <PasswordField
          label="Mot de passe actuel"
          value={currentPwd}
          onChange={setCurrentPwd}
          placeholder="Votre mot de passe actuel"
          hint="Entrez votre mot de passe actuel pour autoriser le changement"
        />
        <div>
          <PasswordField
            label="Nouveau mot de passe"
            value={newPwd}
            onChange={(v) => { setNewPwd(v); setPwdError(null); }}
            placeholder="8 caractères minimum"
            hint="Utilisez majuscules, chiffres et symboles pour un mot de passe fort"
          />
          <PasswordStrength password={newPwd} />
        </div>
        <div>
          <PasswordField
            label="Confirmer le nouveau mot de passe"
            value={confirmPwd}
            onChange={(v) => { setConfirmPwd(v); setPwdError(null); }}
            placeholder="Répétez le nouveau mot de passe"
            hint="Doit être identique au nouveau mot de passe ci-dessus"
          />
          {mismatch && (
            <p className="text-rose-neon text-xs mt-1">Les mots de passe ne correspondent pas</p>
          )}
        </div>

        {/* Message d'erreur ou succès inline */}
        {pwdError && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-neon/10 border border-rose-neon/20">
            <AlertTriangle className="w-4 h-4 text-rose-neon flex-shrink-0 mt-0.5" />
            <p className="text-rose-neon text-xs">{pwdError}</p>
          </div>
        )}
        {pwdSuccess && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
            <Check className="w-4 h-4 text-green-400" />
            <p className="text-green-400 text-xs">Mot de passe mis à jour avec succès</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={changePwdMutation.isLoading || !currentPwd || !newPwd || !confirmPwd || mismatch}
            className="neon-button text-sm py-2 px-5 disabled:opacity-40"
          >
            {changePwdMutation.isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </div>
      </div>

      {/* Supprimer le compte */}
      <div className="glass-card p-6 border border-rose-neon/20">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-rose-neon" />
          <h3 className="text-rose-neon text-sm font-medium">Zone dangereuse</h3>
        </div>
        <p className="text-white/40 text-xs leading-relaxed mb-4">
          La suppression de votre compte anonymise toutes vos données personnelles de façon irréversible.
          Vos commandes et paiements sont conservés 5 ans pour des raisons légales, sans lien avec votre identité.
        </p>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 text-rose-neon text-sm hover:opacity-80 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer mon compte
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-white/60 text-xs">Tapez <span className="text-rose-neon font-mono">SUPPRIMER</span> pour confirmer :</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full bg-bg-secondary border border-rose-neon/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-neon transition-colors"
              placeholder="SUPPRIMER"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAcc.isLoading || deleteConfirm !== 'SUPPRIMER'}
                className="flex-1 py-2 rounded-xl bg-rose-neon/10 border border-rose-neon/30 text-rose-neon text-sm font-semibold hover:bg-rose-neon/20 transition-colors disabled:opacity-40"
              >
                {deleteAcc.isLoading ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
              <button
                onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}
                className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-sm hover:bg-white/10 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────

export default function MonCompte() {
  const { user } = useAuthStore();
  const role = user?.role ?? 'BUYER';
  const tabs = TABS_BY_ROLE[role] ?? TABS_BY_ROLE['BUYER'];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Bloquer les organisateurs non approuvés
  const { data: orgProfile } = useQuery(
    'organizer-profile',
    organizerService.getProfile,
    { enabled: role === 'ORGANIZER', staleTime: 60_000 }
  );
  if (role === 'ORGANIZER' && orgProfile !== undefined && !orgProfile.isApproved) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-bg py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to={role === 'ORGANIZER' ? '/dashboard' : role === 'ADMIN' ? '/admin' : '/'}
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-bebas text-4xl sm:text-5xl tracking-wider text-gradient">Mon Compte</h1>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-neon/20 text-violet-neon border border-violet-neon/40'
                  : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'profil'       && <TabProfil />}
            {activeTab === 'organisateur' && <TabOrganisateur />}
            {activeTab === 'commandes'    && <TabCommandes />}
            {activeTab === 'attente'      && <TabAttente />}
            {activeTab === 'securite'     && <TabSecurite />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
