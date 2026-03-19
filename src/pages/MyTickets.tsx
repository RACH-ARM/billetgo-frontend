import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, ImageDown, Trash2, Bell, BellOff, CheckCircle2, Clock, FileDown, RotateCcw, X, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { useMyOrders } from '../hooks/useTickets';
import { formatEventDate } from '../utils/formatDate';
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
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [refundModal, setRefundModal] = useState<{ type: 'order' | 'ticket'; id: string; eventTitle: string } | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [transferModal, setTransferModal] = useState<{ ticketId: string; ticketNum: number; eventTitle: string } | null>(null);
  const [transferInput, setTransferInput] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Impossible de transférer le billet');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDownloadPDF = async (orderId: string, tickets: { id: string; status: string }[], eventTitle: string) => {
    const unused = tickets.filter((t) => t.status !== 'CANCELLED');
    if (unused.length === 0) return;
    setDownloadingPdf(orderId);
    try {
      // Télécharger chaque billet PDF individuellement
      for (const ticket of unused) {
        const response = await api.get(`/tickets/${ticket.id}/pdf`, { responseType: 'blob' });
        const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `billet-${eventTitle.replace(/\s+/g, '-')}-${ticket.id.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success(`${unused.length} billet(s) téléchargé(s)`);
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloadingPdf(null);
    }
  };
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [togglingNotifs, setTogglingNotifs] = useState(false);

  const handleToggleNotifications = async () => {
    setTogglingNotifs(true);
    try {
      const next = !notificationsEnabled;
      await api.patch('/auth/me/notifications', { notificationsEnabled: next });
      setNotificationsEnabled(next);
      toast.success(next ? 'Notifications activées' : 'Notifications désactivées');
    } catch {
      toast.error('Impossible de modifier les préférences');
    } finally {
      setTogglingNotifs(false);
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

      <div className="mb-6">
        <div className="flex items-start gap-3 glass-card p-4 border border-cyan-neon/20 bg-cyan-neon/5">
          <ImageDown className="w-5 h-5 text-cyan-neon flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white/80 font-medium">Enregistrez votre billet dans votre galerie</p>
            <p className="text-xs text-white/40 mt-0.5">
              Appuyez sur "Afficher le QR code" puis sur "Enregistrer" — votre billet est généré en image
              et envoyé dans votre galerie photo. Retrouvez-le à tout moment, même sans connexion.
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map(i => <SkeletonOrder key={i} />)}
        </div>
      )}

      {!isLoading && (!orders || orders.length === 0) && (
        <div className="glass-card p-12 text-center">
          <p className="text-white/40 text-lg">Vous n'avez pas encore de billets</p>
          <p className="text-white/20 text-sm mt-2">Explorez les événements et achetez votre premier ticket !</p>
        </div>
      )}

      <div className="space-y-4">
        {orders?.map((order: any, i: number) => {
          const totalTickets: number = order.tickets?.length ?? 0;
          const usedTickets: number = order.tickets?.filter((t: any) => t.status === 'USED').length ?? 0;
          const totalItems: string = order.orderItems
            .map((item: any) => `${item.quantity}× ${item.category.name}`)
            .join(', ');
          const isCompleted = order.status === 'COMPLETED';

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Event cover */}
                <div className="md:w-32 h-32 md:h-auto flex-shrink-0 bg-bg-secondary">
                  {order.event.coverImageUrl ? (
                    <img src={order.event.coverImageUrl} alt="" className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }} />
                  )}
                </div>

                {/* Order info */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bebas text-xl tracking-wide text-white">{order.event.title}</h3>
                      <p className="text-xs text-white/50">{formatEventDate(order.event.eventDate)}</p>
                      <p className="text-xs text-white/40 mt-0.5">{order.event.venueName}</p>
                    </div>
                    <Badge variant={ORDER_STATUS_VARIANT[order.status] || 'gray'}>
                      {ORDER_STATUS_LABEL[order.status] || order.status}
                    </Badge>
                  </div>

                  {/* Détail billets */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
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
                  {isCompleted && totalTickets > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      {usedTickets >= totalTickets ? (
                        <span className="flex items-center gap-1.5 text-xs text-rose-neon">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tous les billets ont été utilisés
                        </span>
                      ) : usedTickets === 0 ? (
                        <span className="flex items-center gap-1.5 text-xs text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {totalTickets} entrée{totalTickets > 1 ? 's' : ''} disponible{totalTickets > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-yellow-400">
                          <Clock className="w-3.5 h-3.5" />
                          {usedTickets}/{totalTickets} utilisé{usedTickets > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* QR Code groupe */}
                  {totalTickets > 0 ? (
                    <div className="mt-4 space-y-3">
                      <QRCodeDisplay
                        orderId={order.id}
                        usedCount={usedTickets}
                        totalCount={totalTickets}
                        eventTitle={order.event.title}
                        categoryName={order.orderItems[0]?.category?.name}
                        eventDate={order.event.eventDate}
                        venueName={order.event.venueName}
                        coverImageUrl={order.event.coverImageUrl}
                      />
                      <button
                        onClick={() => handleDownloadPDF(order.id, order.tickets ?? [], order.event.title)}
                        disabled={downloadingPdf === order.id}
                        className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl bg-violet-neon/10 border border-violet-neon/30 text-violet-neon hover:bg-violet-neon/20 transition-colors disabled:opacity-40"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        {downloadingPdf === order.id ? 'Téléchargement...' : `Télécharger ${totalTickets > 1 ? `les ${totalTickets} billets` : 'le billet'} (PDF)`}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-white/30 mt-3 italic">
                      Le QR Code sera disponible après confirmation du paiement.
                    </p>
                  )}

                  {/* Remboursement — commande entière (si remboursement déjà traité au niveau commande) */}
                  {order.status === 'REFUNDED' && (
                    <p className="mt-3 text-xs flex items-center gap-1.5 text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Commande remboursée
                    </p>
                  )}
                  {order.refundStatus === 'REQUESTED' && (
                    <p className="mt-3 text-xs flex items-center gap-1.5 text-yellow-400">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Remboursement total en cours d'examen
                    </p>
                  )}

                  {/* Remboursement partiel — billet par billet */}
                  {isCompleted && order.status !== 'REFUNDED' && order.refundStatus === 'NONE' && new Date(order.event.eventDate) > new Date() && order.tickets && order.tickets.length > 0 && (
                    <div className="mt-4 border-t border-white/5 pt-3 space-y-1.5">
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Billets</p>
                      {order.tickets.map((ticket: any, idx: number) => {
                        const tRefund = ticket.refundStatus ?? 'NONE';
                        return (
                          <div key={ticket.id} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-white/50">
                              Billet {String(idx + 1).padStart(2, '0')}
                              <span className="font-mono text-white/20 ml-1.5">{ticket.id.slice(0, 8)}</span>
                            </span>
                            {ticket.status === 'USED' ? (
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
                            ) : tRefund === 'REJECTED' ? (
                              <span className="text-xs text-white/30 flex items-center gap-1">
                                <X className="w-3 h-3" /> Refusé
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
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
                    </div>
                  )}
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
            onClick={() => { setTransferModal(null); setTransferSuccess(null); }}
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
                    onClick={() => { setTransferModal(null); setTransferSuccess(null); window.location.reload(); }}
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
                      onClick={() => { setTransferModal(null); setTransferSuccess(null); }}
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

        <div className="flex items-center justify-between glass-card p-4 border border-white/5 rounded-xl mb-4 max-w-md">
          <div className="flex items-center gap-3">
            {notificationsEnabled
              ? <Bell className="w-4 h-4 text-violet-neon" />
              : <BellOff className="w-4 h-4 text-white/30" />
            }
            <div>
              <p className="text-sm text-white/70">Notifications email & WhatsApp</p>
              <p className="text-xs text-white/30">{notificationsEnabled ? 'Activées' : 'Désactivées'}</p>
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={togglingNotifs}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${notificationsEnabled ? 'bg-violet-neon' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

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
