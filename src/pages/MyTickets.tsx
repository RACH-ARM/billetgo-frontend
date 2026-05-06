import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ChevronLeft, HelpCircle, ImageDown, Trash2, CheckCircle2, Clock, RotateCcw, X, ArrowRightLeft, ArrowDownToLine, ChevronDown, ChevronUp, MailWarning, CalendarCheck, Ticket, RefreshCw } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { useMyOrders, useReceivedTickets } from '../hooks/useTickets';
import { formatEventDate, formatReceiptDate } from '../utils/formatDate';
import { formatPrice } from '../utils/formatPrice';
import QRCodeDisplay from '../components/tickets/QRCodeDisplay';
import Badge from '../components/common/Badge';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

function SkeletonOrder() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-32 h-32 md:h-auto flex-shrink-0 bg-white/[0.07]" />
        <div className="flex-1 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-white/[0.07] rounded w-48" />
              <div className="h-3 bg-white/[0.05] rounded w-36" />
              <div className="h-3 bg-white/[0.04] rounded w-28" />
            </div>
            <div className="h-6 bg-white/[0.07] rounded-full w-20" />
          </div>
          <div className="flex gap-3 pt-1">
            <div className="h-9 bg-white/[0.06] rounded-xl w-32" />
            <div className="h-9 bg-white/[0.06] rounded-xl w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

const ORDER_STATUS_VARIANT: Record<string, 'green' | 'gray' | 'rose'> = {
  COMPLETED: 'green',
  PENDING: 'gray',
  PENDING_FAILED: 'rose',
  PROCESSING: 'gray',
  FAILED: 'rose',
  CANCELLED: 'rose',
  REFUNDED: 'rose',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Confirmée',
  PENDING: 'En attente',
  PENDING_FAILED: 'Paiement échoué',
  PROCESSING: 'En cours',
  FAILED: 'Échouée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

const getEffectiveStatus = (order: any): string => {
  if (order.status === 'PENDING' && order.payments?.some((p: any) => p.status === 'FAILED')) {
    return 'PENDING_FAILED';
  }
  return order.status;
};

export default function MyTickets() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get('token');
  const { isAuthenticated } = useAuthStore();

  const prefetchedGuestData = (location.state as any)?.guestData as { email: string; tickets: any[] } | undefined;

  if (!isAuthenticated && (token || prefetchedGuestData)) {
    return <GuestTicketsView token={token ?? undefined} prefetchedData={prefetchedGuestData} />;
  }

  return <AuthenticatedMyTickets />;
}

function GuestOrderGroups({ tickets }: { tickets: any[] }) {
  const orderGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const ticket of tickets) {
      const key = ticket.order?.id ?? '__unknown__';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ticket);
    }
    return Array.from(map.values());
  }, [tickets]);

  return (
    <div className="space-y-4">
      {orderGroups.map((group: any[], i: number) => {
        const firstTicket = group[0];
        const event = firstTicket.category?.event;
        const order = firstTicket.order;
        const activeTickets = group.filter((t: any) => t.status !== 'REFUNDED' && t.status !== 'CANCELLED');
        const usedCount = group.filter((t: any) => t.status === 'USED').length;
        const totalCount = activeTickets.length;
        const ticketsSubtotal = group.reduce((s: number, t: any) => s + Number(t.category?.price ?? 0), 0);
        const categoryLabel = Object.entries(
          activeTickets.reduce((acc: Record<string, number>, t: any) => {
            const name = t.category?.name ?? '';
            acc[name] = (acc[name] ?? 0) + 1;
            return acc;
          }, {})
        ).map(([name, qty]) => `${qty}× ${name}`).join(', ') || firstTicket.category?.name;
        const allCancelled = activeTickets.length === 0;

        return (
          <motion.div
            key={order?.id ?? i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              {event?.coverImageUrl && (
                <img src={event.coverImageUrl} alt="" className="w-16 h-16 rounded-xl object-cover opacity-80 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bebas text-lg tracking-wide text-white">{event?.title}</h3>
                <p className="text-xs text-white/50">{event?.eventDate ? formatEventDate(event.eventDate) : ''}</p>
                <p className="text-xs text-white/40">{event?.venueName}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="bg-violet-neon/20 text-violet-neon text-xs px-3 py-1 rounded-full border border-violet-neon/30 max-w-[220px] truncate">
                    {categoryLabel}
                  </span>
                  <span className="font-mono text-cyan-neon text-sm font-bold">
                    {formatPrice(ticketsSubtotal)}
                  </span>
                </div>
              </div>
              <Badge variant={allCancelled ? 'rose' : usedCount >= totalCount && totalCount > 0 ? 'gray' : 'green'}>
                {allCancelled ? 'Annulé' : usedCount >= totalCount && totalCount > 0 ? 'Utilisé' : 'Disponible'}
              </Badge>
            </div>
            {allCancelled ? (
              <p className="text-xs text-white/30 italic">Billet annulé ou remboursé.</p>
            ) : (
              <QRCodeDisplay
                orderId={order?.id}
                publicQrUrl={order?.qrPublicUrl}
                usedCount={usedCount}
                totalCount={totalCount || 1}
                eventTitle={event?.title ?? ''}
                categoryName={categoryLabel}
                eventDate={event?.eventDate ?? ''}
                venueName={event?.venueName ?? ''}
                coverImageUrl={event?.coverImageUrl ?? null}
                buyerName={order?.buyerName}
                price={ticketsSubtotal}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function GuestTicketsView({ token, prefetchedData }: { token?: string; prefetchedData?: { email: string; tickets: any[] } }) {
  const [guestData, setGuestData] = useState<{ email: string; tickets: any[] } | null>(prefetchedData ?? null);
  const [loading, setLoading] = useState(!prefetchedData && !!token);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState(!prefetchedData && !token);

  useEffect(() => {
    if (prefetchedData || !token) return;
    api.get(`/tickets/by-token?token=${encodeURIComponent(token)}`)
      .then(({ data }) => setGuestData(data.data))
      .catch((err: any) => {
        if (err?.response?.data?.code === 'TOKEN_EXPIRED') setExpired(true);
        else setError(true);
      })
      .finally(() => setLoading(false));
  }, [token, prefetchedData]);

  const backendBase = import.meta.env.VITE_BACKEND_URL ?? import.meta.env.VITE_API_URL ?? '';
  const googleUrl = `${backendBase}/api/v1/auth/google?origin=${encodeURIComponent(window.location.origin)}`;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-4">
        {[0, 1, 2].map((i) => <SkeletonOrder key={i} />)}
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-neon/10 border border-rose-neon/30 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-rose-neon" />
          </div>
          <div>
            <h2 className="font-bebas text-2xl tracking-wider text-white mb-2">Lien expiré</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Ce lien d'accès n'est valable que 24 heures. Demandez-en un nouveau.
            </p>
          </div>
          <Link
            to="/retrouver-mes-billets"
            className="neon-button inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Obtenir un nouveau lien
          </Link>
          <Link to="/" className="block text-white/30 hover:text-white text-sm transition-colors">
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    );
  }

  if (error || !guestData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-10 max-w-md w-full text-center space-y-4">
          <p className="text-white/60">Lien invalide ou inaccessible.</p>
          <Link to="/retrouver-mes-billets" className="text-violet-neon text-sm hover:underline">
            Redemander un lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm mb-4">
        <ChevronLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>

      <h1 className="font-bebas text-5xl tracking-wider text-gradient mb-2">MES BILLETS</h1>
      <p className="text-white/40 text-sm mb-6">Accès temporaire pour <span className="text-white/70">{guestData.email}</span></p>

      <div className="mb-4">
        <div className="flex items-start gap-3 glass-card p-4 border border-cyan-neon/20 bg-cyan-neon/5">
          <ImageDown className="w-5 h-5 text-cyan-neon flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/50 leading-relaxed">
            Appuyez sur <strong>"Afficher le QR Code"</strong> puis sur "Enregistrer" pour sauvegarder votre billet dans votre galerie — accessible hors connexion.
          </p>
        </div>
      </div>

      {guestData.tickets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/40">Aucun billet associé à cet email.</p>
        </div>
      ) : (
        <GuestOrderGroups tickets={guestData.tickets} />
      )}

      <div className="mt-4 text-center">
        <Link to="/retrouver-mes-billets" className="text-xs text-white/30 hover:text-violet-neon transition-colors">
          <Ticket className="w-3.5 h-3.5 inline mr-1" />
          Rechercher avec une autre adresse email
        </Link>
      </div>

      {/* Google CTA */}
      <div className="mt-6 glass-card p-5 border border-violet-neon/20 space-y-3">
        <p className="text-sm text-white/70 font-medium">Créez un compte pour un accès permanent à vos billets</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              localStorage.setItem('auth_redirect', '/mes-billets');
              window.location.href = googleUrl;
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-violet-neon/30 bg-white/5 hover:bg-white/10 text-sm text-white transition-colors font-semibold"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>
          <Link
            to="/register"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 text-sm transition-colors"
          >
            Créer un compte par email
          </Link>
        </div>
      </div>

    </div>
  );
}

function AuthenticatedMyTickets() {
  const { data: orders, isLoading } = useMyOrders();

  // Bloquer le retour arrière — l'utilisateur ne peut quitter que via "Retour à l'accueil"
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const { data: receivedTickets } = useReceivedTickets();
  const { logout, user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transferModal, setTransferModal] = useState<{ ticketId: string; ticketNum: number; eventTitle: string } | null>(null);
  const [transferInput, setTransferInput] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

  // Liste fusionnée commandes + billets reçus, triée par date de réception desc
  // Les commandes COMPLETED avec des billets actifs (UNUSED) remontent en premier
  const feedEntries = useMemo(() => {
    const entries: Array<{ type: 'order' | 'received'; data: any; receivedAt: Date }> = [];
    (orders ?? []).forEach((o: any) => {
      entries.push({ type: 'order', data: o, receivedAt: new Date(o.createdAt) });
    });
    (receivedTickets ?? []).forEach((t: any) => {
      entries.push({ type: 'received', data: t, receivedAt: new Date(t.updatedAt) });
    });
    return entries.sort((a, b) => {
      const priority = (entry: typeof entries[0]) => {
        if (entry.type === 'received') {
          return entry.data.status === 'UNUSED' ? 1 : 3;
        }
        const o = entry.data;
        const hasActive = (o.tickets ?? []).some((t: any) => t.status === 'UNUSED' && t.buyerId === user?.id);
        if (o.status === 'COMPLETED' && hasActive) return 0;
        if (o.status === 'COMPLETED') return 2;
        return 3;
      };
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      return b.receivedAt.getTime() - a.receivedAt.getTime();
    });
  }, [orders, receivedTickets, user?.id]);

  const toggleTickets = (orderId: string) => {
    setExpandedTickets((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleTransfer = async () => {
    if (!transferModal || !transferInput.trim()) return;
    setTransferLoading(true);
    setTransferSuccess(null);
    try {
      const isEmail = transferInput.includes('@');
      const payload = isEmail
        ? { recipientEmail: transferInput.trim() }
        : { recipientPhone: transferInput.trim().replace(/\s/g, '') };
      const { data } = await api.post(`/tickets/${transferModal.ticketId}/transfer`, payload);
      setTransferSuccess(data.data.recipientName);
      setTransferInput('');
      toast.success(`Billet transféré à ${data.data.recipientName}`);
      queryClient.invalidateQueries('my-orders');
      queryClient.invalidateQueries('received-tickets');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Impossible de transférer le billet');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/auth/me');
      await logout();
      toast.success('Compte supprimé. À bientôt.');
      navigate('/');
    } catch {
      toast.error('Erreur lors de la suppression du compte.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm mb-4">
        <ChevronLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-bebas text-5xl tracking-wider text-gradient">MES BILLETS</h1>
        <Link
          to="/comment-ca-marche"
          className="inline-flex items-center gap-1.5 text-violet-neon/70 hover:text-violet-neon transition-colors text-sm font-semibold"
        >
          <HelpCircle className="w-4 h-4" />
          Comment utiliser mes billets ?
        </Link>
      </div>

      {user?.email && !user.isVerified && (
        <div className="mb-4 flex items-start gap-3 glass-card p-4 border border-yellow-400/20 bg-yellow-400/5">
          <MailWarning className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white/80 font-medium">Vérifiez votre email</p>
            <p className="text-xs text-white/40 mt-0.5">
              Un email vous a été envoyé à <span className="text-yellow-400/80">{user.email}</span>. Vérifiez votre boîte pour recevoir vos billets par email.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-start gap-3 glass-card p-4 border border-cyan-neon/20 bg-cyan-neon/5">
          <ImageDown className="w-5 h-5 text-cyan-neon flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white/80 font-medium">Enregistrez votre billet en image</p>
            <p className="text-xs text-white/40 mt-0.5">
              Affichez le QR code puis appuyez sur "Enregistrer" — disponible dans votre galerie, même sans connexion.
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map(i => <SkeletonOrder key={i} />)}
        </div>
      )}

      {!isLoading && feedEntries.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-white/40 text-lg">Vous n'avez pas encore de billets</p>
          <p className="text-white/20 text-sm mt-2">Explorez les événements et achetez votre premier ticket !</p>
        </div>
      )}

      <div className="space-y-4">
        {feedEntries.map((entry, i) => {
          if (entry.type === 'received') {
            const ticket = entry.data;
            return (
              <motion.div
                key={`received-${ticket.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-5 border border-cyan-neon/20"
              >
                {/* Badge réception */}
                <div className="flex items-center gap-1.5 text-xs text-cyan-neon/70 mb-3">
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Billet reçu par transfert</span>
                  <span className="text-white/20 mx-1">·</span>
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>{formatReceiptDate(ticket.updatedAt)}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {ticket.category.event.coverImageUrl && (
                    <img
                      src={ticket.category.event.coverImageUrl}
                      alt=""
                      className="w-full sm:w-24 h-20 object-cover rounded-xl opacity-70 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bebas text-lg tracking-wide text-white">{ticket.category.event.title}</h3>
                    <p className="text-xs text-white/50">{formatEventDate(ticket.category.event.eventDate)}</p>
                    <p className="text-xs text-white/40">{ticket.category.event.venueName}</p>
                    <span className="inline-block mt-2 bg-cyan-neon/20 text-cyan-neon text-xs px-3 py-1 rounded-full border border-cyan-neon/30">
                      {ticket.category.name}
                    </span>
                    <div className="mt-2">
                      {ticket.status === 'USED' ? (
                        <span className="flex items-center gap-1.5 text-xs text-rose-neon">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Billet déjà utilisé
                        </span>
                      ) : ticket.status === 'REFUNDED' || ticket.status === 'CANCELLED' ? (
                        <span className="flex items-center gap-1.5 text-xs text-white/30">
                          <X className="w-3.5 h-3.5" />
                          Billet annulé
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          1 entrée disponible
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <QRCodeDisplay
                    ticketId={ticket.id}
                    usedCount={ticket.status === 'USED' ? 1 : 0}
                    totalCount={1}
                    eventTitle={ticket.category.event.title}
                    categoryName={ticket.category.name}
                    eventDate={ticket.category.event.eventDate}
                    venueName={ticket.category.event.venueName}
                    coverImageUrl={ticket.category.event.coverImageUrl}
                    buyerName={user ? `${user.firstName} ${user.lastName}` : undefined}
                    buyerEmail={user?.email ?? undefined}
                    price={ticket.category.price}
                    disabled={ticket.status === 'REFUNDED' || ticket.status === 'CANCELLED'}
                  />
                </div>
              </motion.div>
            );
          }

          const order = entry.data;
          // Exclure les billets transférés (buyerId !== user.id) des compteurs de l'envoyeur
          const myTickets = (order.tickets ?? []).filter((t: any) => t.buyerId === user?.id);
          const activeTickets: number = myTickets.filter((t: any) => t.status !== 'REFUNDED' && t.status !== 'CANCELLED').length;
          const usedTickets: number = myTickets.filter((t: any) => t.status === 'USED').length;
          const availableTickets: number = myTickets.filter((t: any) => t.status === 'UNUSED').length;
          const totalItems: string = order.orderItems
            .map((item: any) => `${item.quantity}× ${item.category.name}`)
            .join(', ');
          const isCompleted = order.status === 'COMPLETED';
          const ticketsSubtotal: number = (order.orderItems ?? []).reduce(
            (s: number, i: any) => s + Number(i.unitPrice) * i.quantity, 0
          );

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card"
            >
              <div className="flex flex-col md:flex-row">
                {/* Event cover */}
                <div className="md:w-24 h-24 md:h-auto flex-shrink-0 bg-bg-secondary overflow-hidden rounded-t-2xl md:rounded-t-none md:rounded-l-2xl">
                  {order.event.coverImageUrl ? (
                    <img src={order.event.coverImageUrl} alt="" className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }} />
                  )}
                </div>

                {/* Order info */}
                <div className="flex-1 p-4">
                  {/* Badge date de réception */}
                  <div className="flex items-center gap-1.5 text-xs text-white/30 mb-2">
                    <CalendarCheck className="w-3 h-3" />
                    <span>Reçu le {formatReceiptDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bebas text-lg tracking-wide text-white">{order.event.title}</h3>
                      <p className="text-xs text-white/50">{formatEventDate(order.event.eventDate)}</p>
                      <p className="text-xs text-white/40">{order.event.venueName}</p>
                    </div>
                    <Badge variant={ORDER_STATUS_VARIANT[getEffectiveStatus(order)] || 'gray'}>
                      {ORDER_STATUS_LABEL[getEffectiveStatus(order)] || order.status}
                    </Badge>
                  </div>

                  {/* Détail billets */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span
                      className="bg-violet-neon/20 text-violet-neon text-xs px-3 py-1 rounded-full border border-violet-neon/30 min-w-0 max-w-[220px] truncate inline-block"
                      title={totalItems}
                    >
                      {totalItems}
                    </span>
                    <span className="font-mono text-cyan-neon text-sm font-bold">
                      {formatPrice(ticketsSubtotal)}
                    </span>
                  </div>

                  {/* Statut utilisation */}
                  {isCompleted && (
                    <div className="flex items-center gap-2 mt-1.5">
                      {myTickets.length === 0 && (order.tickets?.length ?? 0) > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs text-white/40">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Tous les billets ont été transférés
                        </span>
                      ) : availableTickets === 0 && usedTickets > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs text-rose-neon">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tous les billets ont été utilisés
                        </span>
                      ) : activeTickets > 0 && usedTickets === 0 ? (
                        <span className="flex items-center gap-1.5 text-xs text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {availableTickets} entrée{availableTickets > 1 ? 's' : ''} disponible{availableTickets > 1 ? 's' : ''}
                        </span>
                      ) : activeTickets > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs text-yellow-400">
                          <Clock className="w-3.5 h-3.5" />
                          {availableTickets} restant{availableTickets > 1 ? 's' : ''} sur {activeTickets}
                        </span>
                      ) : null}
                    </div>
                  )}

                  {/* QR Code commande (1 QR pour tout le groupe) */}
                  {(order.tickets?.length ?? 0) > 0 ? (
                    myTickets.length === 0 ? (
                      <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/[0.03] text-center">
                        <ArrowRightLeft className="w-5 h-5 text-white/20 mx-auto mb-1.5" />
                        <p className="text-xs text-white/30">
                          Tous les billets de cette commande ont été transférés.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <QRCodeDisplay
                          orderId={order.id}
                          usedCount={usedTickets}
                          totalCount={activeTickets}
                          eventTitle={order.event.title}
                          categoryName={Object.entries(
                            myTickets
                              .filter((t: any) => t.status !== 'REFUNDED' && t.status !== 'CANCELLED')
                              .reduce((acc: Record<string, number>, t: any) => {
                                const name = t.category?.name ?? '';
                                acc[name] = (acc[name] ?? 0) + 1;
                                return acc;
                              }, {})
                          ).map(([name, qty]) => `${qty}× ${name}`).join(', ')}
                          eventDate={order.event.eventDate}
                          venueName={order.event.venueName}
                          coverImageUrl={order.event.coverImageUrl}
                          buyerName={user ? `${user.firstName} ${user.lastName}` : undefined}
                          buyerEmail={user?.email ?? undefined}
                          price={ticketsSubtotal}
                          disabled={
                            order.status === 'REFUNDED' ||
                            (order.tickets ?? []).every((t: any) => t.status === 'REFUNDED' || t.status === 'CANCELLED')
                          }
                        />
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-white/30 mt-3 italic">
                      Le QR Code sera disponible après confirmation du paiement.
                    </p>
                  )}

                  {/* Remboursement — commande entière (si remboursement déjà traité au niveau commande) */}
                  {order.status === 'REFUNDED' && (
                    <p className="mt-2 text-xs flex items-center gap-1.5 text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Commande remboursée
                    </p>
                  )}
                  {order.refundStatus === 'REQUESTED' && (
                    <p className="mt-2 text-xs flex items-center gap-1.5 text-yellow-400">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Remboursement total en cours d'examen
                    </p>
                  )}

                  {/* Liste des billets — toujours visible dès qu'il y a des tickets */}
                  {order.tickets && order.tickets.length > 0 && (() => {
                    const tickets = order.tickets;
                    const isExpanded = expandedTickets.has(order.id);
                    const isFutureEvent = new Date(order.event.eventDate) > new Date();
                    const canAct = order.status !== 'REFUNDED';
                    const SHOW = 3;
                    const visibleTickets = isExpanded ? tickets : tickets.slice(0, SHOW);
                    const hiddenCount = tickets.length - SHOW;
                    return (
                      <div className="mt-3 border-t border-white/5 pt-2.5 space-y-1.5">
                        <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Billets</p>
                        {visibleTickets.map((ticket: any, idx: number) => {
                          const tRefund = ticket.refundStatus ?? 'NONE';
                          const isTransferred = ticket.buyerId && ticket.buyerId !== user?.id;
                          const showActions = canAct && isFutureEvent && !isTransferred && ticket.status === 'UNUSED' && tRefund !== 'REQUESTED' && tRefund !== 'APPROVED';
                          return (
                            <div key={ticket.id} className="flex items-center justify-between gap-2">
                              <span className="text-xs text-white/50">
                                Billet {String(idx + 1).padStart(2, '0')}
                                {ticket.category?.name && (
                                  <span className="ml-1.5 text-violet-neon/70 font-medium">{ticket.category.name}</span>
                                )}
                                <span className="font-mono text-white/20 ml-1.5">{ticket.id.slice(0, 8)}</span>
                              </span>
                              {isTransferred ? (
                                <span className="text-xs text-cyan-neon flex items-center gap-1">
                                  <ArrowRightLeft className="w-3 h-3" /> Transféré
                                </span>
                              ) : ticket.status === 'USED' ? (
                                <span className="text-xs text-white/20">Utilisé</span>
                              ) : ticket.status === 'REFUNDED' ? (
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Remboursé
                                </span>
                              ) : tRefund === 'REQUESTED' ? (
                                <span className="text-xs text-yellow-400 flex items-center gap-1">
                                  <RotateCcw className="w-3 h-3" /> En examen
                                </span>
                              ) : tRefund === 'APPROVED' ? (
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Approuvé
                                </span>
                              ) : showActions ? (
                                <div className="flex items-center gap-2">
                                  {tRefund === 'REJECTED' && (
                                    <>
                                      <span className="text-xs text-white/30 flex items-center gap-1">
                                        <X className="w-3 h-3" /> Refusé
                                      </span>
                                      <span className="text-white/10">·</span>
                                    </>
                                  )}
                                  <button
                                    onClick={() => { setTransferModal({ ticketId: ticket.id, ticketNum: idx + 1, eventTitle: order.event.title }); setTransferSuccess(null); setTransferInput(''); }}
                                    className="text-xs text-white/25 hover:text-cyan-neon transition-colors flex items-center gap-1"
                                  >
                                    <ArrowRightLeft className="w-3 h-3" /> Transférer
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-white/20">Disponible</span>
                              )}
                            </div>
                          );
                        })}
                        {tickets.length > SHOW && (
                          <button
                            onClick={() => toggleTickets(order.id)}
                            className="mt-1.5 flex items-center gap-1.5 text-xs text-violet-neon/60 hover:text-violet-neon transition-colors"
                          >
                            {isExpanded ? (
                              <><ChevronUp className="w-3.5 h-3.5" /> Réduire</>
                            ) : (
                              <><ChevronDown className="w-3.5 h-3.5" /> Voir les {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} billet{hiddenCount > 1 ? 's' : ''}</>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modale transfert */}
      <AnimatePresence>
        {transferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => { if (!transferSuccess) { setTransferModal(null); setTransferSuccess(null); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full border border-cyan-neon/20 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-cyan-neon" />
                  <h3 className="font-bebas text-xl tracking-wider text-white">Transférer le billet</h3>
                </div>
                <button onClick={() => { setTransferModal(null); setTransferSuccess(null); }} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {transferSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-cyan-neon mx-auto mb-3" />
                  <p className="text-white font-semibold text-lg">Transfert effectué</p>
                  <p className="text-white/50 text-sm mt-1">
                    Billet {String(transferModal.ticketNum).padStart(2, '0')} transféré à <span className="text-cyan-neon font-semibold">{transferSuccess}</span>
                  </p>
                  <p className="text-white/30 text-xs mt-3">
                    Votre QR Code a été invalidé. Le destinataire a reçu une notification.
                  </p>
                  <button
                    onClick={() => { setTransferModal(null); setTransferSuccess(null); }}
                    className="mt-5 px-6 py-2.5 rounded-xl bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon text-sm font-semibold hover:bg-cyan-neon/20 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/60 mb-1">
                    <span className="text-white font-medium">{transferModal.eventTitle}</span>
                    {' '}— Billet {String(transferModal.ticketNum).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-white/30 mb-4">
                    Le destinataire doit avoir un compte BilletGab. Votre QR Code sera invalidé immédiatement.
                  </p>
                  <div className="mb-4">
                    <label className="block text-xs text-white/50 uppercase tracking-widest mb-1.5">
                      Email ou téléphone du destinataire
                    </label>
                    <input
                      type="text"
                      value={transferInput}
                      onChange={(e) => setTransferInput(e.target.value)}
                      placeholder="ex : 074000000 ou ami@email.com"
                      className="w-full bg-bg-card border border-cyan-neon/20 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-cyan-neon transition-colors text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setTransferModal(null); setTransferInput(''); }}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleTransfer}
                      disabled={transferLoading || !transferInput.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-neon/10 border border-cyan-neon/40 text-cyan-neon hover:bg-cyan-neon/20 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {transferLoading ? 'Transfert...' : 'Confirmer le transfert'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone données personnelles */}
      <div className="mt-16 pt-8 border-t border-white/5">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Mes données personnelles</h2>

  {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-rose-neon transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer mon compte et mes données
          </button>
        ) : (
          <div className="glass-card p-5 border border-rose-neon/30 max-w-md">
            <p className="text-sm text-white/70 mb-1 font-semibold">Confirmer la suppression ?</p>
            <p className="text-xs text-white/40 mb-4">
              Toutes vos données personnelles seront effacées. Vos commandes sont conservées 5 ans
              pour des raisons légales, mais anonymisées. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl bg-rose-neon/10 border border-rose-neon/40 text-rose-neon hover:bg-rose-neon/20 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
