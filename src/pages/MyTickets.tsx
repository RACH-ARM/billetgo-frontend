import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, ImageDown, Trash2, CheckCircle2, Clock, RotateCcw, X, ArrowRightLeft, ArrowDownToLine, ChevronDown, ChevronUp, MailWarning, CalendarCheck } from 'lucide-react';
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
  PROCESSING: 'gray',
  FAILED: 'rose',
  CANCELLED: 'rose',
  REFUNDED: 'rose',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Confirmée',
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  FAILED: 'Échouée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export default function MyTickets() {
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
  const [refundModal, setRefundModal] = useState<{ type: 'order' | 'ticket'; id: string; eventTitle: string } | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
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

  const handleRequestRefund = async () => {
    if (!refundModal) return;
    setRefundLoading(true);
    try {
      if (refundModal.type === 'order') {
        await api.post(`/orders/${refundModal.id}/refund`, { reason: refundReason.trim() || undefined });
      } else {
        await api.post(`/tickets/${refundModal.id}/refund`, { reason: refundReason.trim() || undefined });
      }
      toast.success('Demande de remboursement soumise. Nous reviendrons vers vous sous 48h.');
      setRefundModal(null);
      setRefundReason('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Impossible de soumettre la demande');
    } finally {
      setRefundLoading(false);
    }
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
          const totalTickets: number = order.tickets?.length ?? 0;
          // Exclure les billets transférés (buyerId !== user.id) des compteurs de l'envoyeur
          const myTickets = (order.tickets ?? []).filter((t: any) => t.buyerId === user?.id);
          const activeTickets: number = myTickets.filter((t: any) => t.status !== 'REFUNDED' && t.status !== 'CANCELLED').length;
          const usedTickets: number = myTickets.filter((t: any) => t.status === 'USED').length;
          const availableTickets: number = myTickets.filter((t: any) => t.status === 'UNUSED').length;
          const totalItems: string = order.orderItems
            .map((item: any) => `${item.quantity}× ${item.category.name}`)
            .join(', ');
          const isCompleted = order.status === 'COMPLETED';

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
                    <Badge variant={ORDER_STATUS_VARIANT[order.status] || 'gray'}>
                      {ORDER_STATUS_LABEL[order.status] || order.status}
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
                      {formatPrice(order.totalAmount)}
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
                          categoryName={order.orderItems.map((item: any) => `${item.quantity}× ${item.category.name}`).join(', ')}
                          eventDate={order.event.eventDate}
                          venueName={order.event.venueName}
                          coverImageUrl={order.event.coverImageUrl}
                          buyerName={user ? `${user.firstName} ${user.lastName}` : undefined}
                          buyerEmail={user?.email ?? undefined}
                          price={order.totalAmount}
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

                  {/* Remboursement partiel — billet par billet */}
                  {isCompleted && order.status !== 'REFUNDED' && order.refundStatus === 'NONE' && new Date(order.event.eventDate) > new Date() && order.tickets && order.tickets.length > 0 && (() => {
                    const tickets = order.tickets;
                    const isExpanded = expandedTickets.has(order.id);
                    const SHOW = 3;
                    const visibleTickets = isExpanded ? tickets : tickets.slice(0, SHOW);
                    const hiddenCount = tickets.length - SHOW;
                    return (
                      <div className="mt-3 border-t border-white/5 pt-2.5 space-y-1.5">
                        <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Billets</p>
                        {visibleTickets.map((ticket: any, idx: number) => {
                          const tRefund = ticket.refundStatus ?? 'NONE';
                          return (
                            <div key={ticket.id} className="flex items-center justify-between gap-2">
                              <span className="text-xs text-white/50">
                                Billet {String(idx + 1).padStart(2, '0')}
                                {ticket.category?.name && (
                                  <span className="ml-1.5 text-violet-neon/70 font-medium">{ticket.category.name}</span>
                                )}
                                <span className="font-mono text-white/20 ml-1.5">{ticket.id.slice(0, 8)}</span>
                              </span>
                              {ticket.buyerId && ticket.buyerId !== user?.id ? (
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
                              ) : (
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
                                  <span className="text-white/10">·</span>
                                  <button
                                    onClick={() => setRefundModal({ type: 'ticket', id: ticket.id, eventTitle: order.event.title })}
                                    className="text-xs text-white/25 hover:text-rose-neon transition-colors flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Rembourser
                                  </button>
                                </div>
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

      {/* Modale remboursement */}
      <AnimatePresence>
        {refundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setRefundModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full border border-rose-neon/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bebas text-xl tracking-wider text-white">Demande de remboursement</h3>
                <button onClick={() => setRefundModal(null)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/60 mb-4">
                <span className="text-white font-medium">{refundModal.eventTitle}</span>
                <br />
                {refundModal.type === 'ticket'
                  ? 'Remboursement d\'un billet individuel. Possible uniquement avant la tenue de l\'événement.'
                  : 'Remboursement de toute la commande. Possible uniquement avant la tenue de l\'événement.'
                }{' '}Traitement sous 48h.
              </p>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Motif de votre demande (optionnel)"
                rows={3}
                className="w-full bg-bg rounded-lg border border-white/10 text-white/80 text-sm p-3 resize-none focus:outline-none focus:border-rose-neon/50 placeholder-white/20 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setRefundModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRequestRefund}
                  disabled={refundLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-neon/10 border border-rose-neon/40 text-rose-neon hover:bg-rose-neon/20 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {refundLoading ? 'Envoi...' : 'Soumettre la demande'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="glass-card p-6 max-w-md w-full border border-cyan-neon/20"
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
                    Le destinataire doit avoir un compte BilletGo. Votre QR Code sera invalidé immédiatement.
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
