import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'react-query';
import {
  ShoppingBag, Minus, Plus, User, Phone, Mail, CheckCircle,
  QrCode, LogOut, BarChart3, Ticket, RefreshCw,
  Banknote, Smartphone, Loader2, XCircle, ChevronDown,
  AlertCircle, Send,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { formatPrice } from '../utils/formatPrice';
import { formatEventDate } from '../utils/formatDate';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketCategory {
  id: string;
  name: string;
  price: number;
  available: number;
  maxPerOrder: number;
}

interface AgentEvent {
  id: string;
  title: string;
  eventDate: string;
  venueName: string;
  coverImageUrl?: string | null;
  ticketCategories: TicketCategory[];
}

interface SaleResult {
  orderId: string;
  qrToken: string;
  totalAmount: number;
  buyerName: string;
}

interface AgentStats {
  totalOrders: number;
  totalRevenue: number;
  recentSales: {
    id: string;
    buyerName: string;
    totalAmount: number;
    createdAt: string;
    event: { title: string };
    orderItems: { quantity: number; category: { name: string } }[];
  }[];
}

type PaymentMethod = 'CASH' | 'MOOV_MONEY' | 'AIRTEL_MONEY';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
function getQRImageUrl(orderId: string, qrToken: string) {
  return `${API_URL}/orders/${orderId}/qr-public?token=${qrToken}`;
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AgentPOS() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [buyerName, setBuyerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');   // numéro Mobile Money

  // ── Overlay state ──────────────────────────────────────────────────────────
  const [showStats, setShowStats] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showWaiting, setShowWaiting] = useState(false);
  const [waitingFailed, setWaitingFailed] = useState(false);

  // ── Sale result ────────────────────────────────────────────────────────────
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [saleWhatsApp, setSaleWhatsApp] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [ticketImageSrc, setTicketImageSrc] = useState<string | null>(null);
  const [ticketImageLoading, setTicketImageLoading] = useState(false);
  const [waResendPhone, setWaResendPhone] = useState('');
  const [waResendSending, setWaResendSending] = useState(false);
  const [waSentNumbers, setWaSentNumbers] = useState<string[]>([]);
  const [emailResend, setEmailResend] = useState('');
  const [emailResendSending, setEmailResendSending] = useState(false);
  const [emailSentList, setEmailSentList] = useState<string[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  // Charger l'image billet complète après chaque vente
  useEffect(() => {
    if (!saleResult) { setTicketImageSrc(null); return; }
    let objectUrl: string | null = null;
    setTicketImageLoading(true);
    api.get(`/agent/orders/${saleResult.orderId}/ticket-image`, { responseType: 'blob' })
      .then(res => { objectUrl = URL.createObjectURL(res.data); setTicketImageSrc(objectUrl); })
      .catch(() => setTicketImageSrc(null))
      .finally(() => setTicketImageLoading(false));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [saleResult?.orderId]);

  const handleWaResend = async () => {
    const phone = waResendPhone.trim();
    if (!phone || !saleResult) return;
    setWaResendSending(true);
    try {
      await api.post(`/agent/orders/${saleResult.orderId}/send-whatsapp`, { phone });
      setWaSentNumbers(prev => [...prev, phone]);
      setWaResendPhone('');
      toast.success(`Billet envoyé · ${phone}`);
    } catch {
      toast.error('Échec de l\'envoi WhatsApp');
    } finally {
      setWaResendSending(false);
    }
  };

  const handleEmailResend = async () => {
    const email = emailResend.trim();
    if (!email || !saleResult) return;
    setEmailResendSending(true);
    try {
      await api.post(`/agent/orders/${saleResult.orderId}/send-email`, { email });
      setEmailSentList(prev => [...prev, email]);
      setEmailResend('');
      toast.success(`Billet envoyé à ${email}`);
    } catch {
      toast.error('Échec de l\'envoi email');
    } finally {
      setEmailResendSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const resetForm = () => {
    setQuantities({});
    setBuyerName('');
    setPayerPhone('');
    setPaymentMethod('CASH');
    setPendingOrderId(null);
    setWaitingFailed(false);
  };

  // ── Données ────────────────────────────────────────────────────────────────

  const { data: events, isLoading: eventsLoading, isFetching: eventsFetching, refetch: refetchEvents } = useQuery<AgentEvent[]>(
    'agent-events',
    async () => { const res = await api.get('/agent/events'); return res.data.data; },
    { refetchOnWindowFocus: false }
  );

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AgentStats>(
    'agent-stats',
    async () => { const res = await api.get('/agent/stats'); return res.data.data; },
    { enabled: showStats, refetchOnWindowFocus: false }
  );

  // Auto-sélectionner si un seul événement
  useEffect(() => {
    if (events?.length === 1 && !selectedEvent) setSelectedEvent(events[0]);
  }, [events, selectedEvent]);

  // ── Polling Mobile Money ───────────────────────────────────────────────────

  const POLL_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

  useEffect(() => {
    if (!showWaiting || !pendingOrderId) return;
    pollStartRef.current = Date.now();

    pollRef.current = setInterval(async () => {
      // Timeout : si le client ne répond pas en 3 minutes → forcer annulation + afficher échec
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        clearInterval(pollRef.current!);
        api.post(`/agent/orders/${pendingOrderId}/cancel`).catch(() => {});
        setWaitingFailed(true);
        return;
      }

      try {
        const res = await api.get(`/agent/orders/${pendingOrderId}/status`);
        const { status, qrToken } = res.data.data as { orderId: string; status: string; qrToken: string | null };

        if (status === 'COMPLETED' && qrToken) {
          clearInterval(pollRef.current!);
          setSaleResult({ orderId: pendingOrderId, qrToken, totalAmount: total, buyerName: buyerName.trim() });
          setSaleWhatsApp('');
          setShowWaiting(false);
          setShowQR(true);
          resetForm();
          refetchEvents();
          refetchStats();
        } else if (status === 'FAILED' || status === 'CANCELLED') {
          clearInterval(pollRef.current!);
          setWaitingFailed(true);
        }
      } catch { /* réseau — retry automatique */ }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWaiting, pendingOrderId]);

  // ── Calculs ────────────────────────────────────────────────────────────────

  const total = selectedEvent
    ? selectedEvent.ticketCategories.reduce((s, c) => s + c.price * (quantities[c.id] ?? 0), 0)
    : 0;
  const totalTickets = Object.values(quantities).reduce((s, q) => s + q, 0);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saleMutation = useMutation(
    async () => {
      const items = Object.entries(quantities).filter(([, q]) => q > 0).map(([id, q]) => ({ categoryId: id, quantity: q }));
      if (items.length === 0) throw new Error('Sélectionnez au moins un billet');
      if (!buyerName.trim()) throw new Error("Le nom de l'acheteur est requis");
      const res = await api.post('/agent/pos/sale', {
        eventId: selectedEvent!.id, items,
        buyerName: buyerName.trim(),
      });
      return res.data.data as SaleResult;
    },
    {
      onSuccess: (data) => {
        setSaleResult(data);
        setSaleWhatsApp('');
        setShowQR(true);
        resetForm();
        refetchEvents();
        refetchStats();
      },
      onError: (err: unknown) => {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur lors de la vente');
      },
    }
  );

  const mobileMoneyMutation = useMutation(
    async () => {
      const items = Object.entries(quantities).filter(([, q]) => q > 0).map(([id, q]) => ({ categoryId: id, quantity: q }));
      if (items.length === 0) throw new Error('Sélectionnez au moins un billet');
      if (!buyerName.trim()) throw new Error("Le nom de l'acheteur est requis");
      if (!payerPhone.trim()) throw new Error('Le numéro Mobile Money du client est requis');
      const res = await api.post('/agent/pos/mobile-money', {
        eventId: selectedEvent!.id, items,
        buyerName: buyerName.trim(),
        payerPhone: payerPhone.trim(),
        operator: paymentMethod,
      });
      return res.data.data as { orderId: string };
    },
    {
      onSuccess: (data) => {
        setPendingOrderId(data.orderId);
        setWaitingFailed(false);
        setShowWaiting(true);
      },
      onError: (err: unknown) => {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur lors de l'initiation du paiement");
      },
    }
  );

  const handleSubmit = () => {
    if (paymentMethod === 'CASH') saleMutation.mutate();
    else mobileMoneyMutation.mutate();
  };

  const handleRetry = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPendingOrderId(null);
    setWaitingFailed(false);
    setShowWaiting(false);
    mobileMoneyMutation.mutate();
  };

  // ── Rendu des overlays ─────────────────────────────────────────────────────

  const opLabel = paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Airtel Money';
  const opColor = paymentMethod === 'MOOV_MONEY' ? 'text-blue-400 border-blue-400/30 bg-blue-400/5' : 'text-red-400 border-red-400/30 bg-red-400/5';

  const isLoading = saleMutation.isLoading || mobileMoneyMutation.isLoading;
  const canSubmit = totalTickets > 0 && !!buyerName.trim() && (paymentMethod === 'CASH' || !!payerPhone.trim()) && !isLoading;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-violet-neon/20 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-bebas text-xl tracking-wider text-violet-neon">AGENT POS</p>
          <p className="text-white/40 text-xs">{user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowStats(true); refetchStats(); }}
            className="p-2 rounded-xl bg-bg-card border border-violet-neon/20 hover:border-violet-neon/50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-violet-neon" />
          </button>
          <button
            onClick={() => refetchEvents()}
            className="p-2 rounded-xl bg-bg-card border border-white/10 hover:border-white/25 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-white/40 transition-transform ${eventsFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-bg-card border border-white/10 hover:border-rose-500/50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-white/50" />
          </button>
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <div className="max-w-xl mx-auto w-full px-4 py-4 flex flex-col gap-5 pb-36">

        {eventsLoading && <div className="text-center py-16 text-white/30">Chargement...</div>}

        {!eventsLoading && (!events || events.length === 0) && (
          <div className="glass-card p-8 text-center mt-8">
            <Ticket className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Aucun événement assigné.</p>
            <p className="text-white/25 text-sm mt-1">Contactez l'administrateur.</p>
          </div>
        )}

        {events && events.length > 0 && (
          <>
            {/* ── Sélecteur d'événement ── */}
            <section>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Événement</h2>
              {events.length === 1 ? (
                <div className="glass-card p-4">
                  <div className="flex gap-3 items-center">
                    {events[0].coverImageUrl
                      ? <img src={events[0].coverImageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-xl bg-violet-neon/10 flex items-center justify-center flex-shrink-0"><Ticket className="w-5 h-5 text-violet-neon/40" /></div>
                    }
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{events[0].title}</p>
                      <p className="text-white/40 text-xs">{formatEventDate(events[0].eventDate)} · {events[0].venueName}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedEvent?.id ?? ''}
                    onChange={(e) => {
                      const ev = events.find((ev) => ev.id === e.target.value) ?? null;
                      setSelectedEvent(ev);
                      setQuantities({});
                    }}
                    className="w-full bg-bg-card border border-violet-neon/20 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-violet-neon transition-colors appearance-none"
                  >
                    <option value="">-- Sélectionner un événement --</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.title} · {formatEventDate(ev.eventDate)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
              )}
            </section>

            {selectedEvent && (
              <>
                {/* ── Billets ── */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Billets</h2>
                    <span className="text-xs text-violet-neon">
                      {selectedEvent.ticketCategories.reduce((s, c) => s + c.available, 0)} disponibles
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedEvent.ticketCategories.map((cat) => {
                      const qty = quantities[cat.id] ?? 0;
                      const soldOut = cat.available === 0;
                      return (
                        <div key={cat.id} className={`glass-card p-4 flex items-center justify-between gap-3 ${soldOut ? 'opacity-50' : ''}`}>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{cat.name}</p>
                            <p className="text-violet-neon text-sm font-semibold">{formatPrice(cat.price)}</p>
                            {soldOut && <p className="text-rose-neon text-xs">Épuisé</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => setQuantities((q) => ({ ...q, [cat.id]: Math.max(0, (q[cat.id] ?? 0) - 1) }))}
                              disabled={qty === 0}
                              className="w-8 h-8 rounded-lg bg-bg-card border border-white/10 flex items-center justify-center disabled:opacity-30 hover:border-violet-neon/50 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-lg">{qty}</span>
                            <button
                              onClick={() => setQuantities((q) => ({ ...q, [cat.id]: Math.min(cat.available, cat.maxPerOrder, (q[cat.id] ?? 0) + 1) }))}
                              disabled={soldOut || qty >= Math.min(cat.available, cat.maxPerOrder)}
                              className="w-8 h-8 rounded-lg bg-bg-card border border-white/10 flex items-center justify-center disabled:opacity-30 hover:border-violet-neon/50 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* ── Mode de paiement ── */}
                <section>
                  <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Mode de paiement</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'CASH',         label: 'Espèces',      Icon: Banknote,   cls: 'border-green-500 bg-green-500/10 text-green-400' },
                      { id: 'MOOV_MONEY',   label: 'Moov Money',   Icon: Smartphone, cls: 'border-blue-400 bg-blue-400/10 text-blue-300'   },
                      { id: 'AIRTEL_MONEY', label: 'Airtel Money', Icon: Smartphone, cls: 'border-red-400 bg-red-400/10 text-red-300'       },
                    ] as const).map(({ id, label, Icon, cls }) => {
                      const active = paymentMethod === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setPaymentMethod(id)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-colors ${active ? cls : 'border-white/10 text-white/40 hover:border-white/25'}`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[11px] font-semibold leading-tight text-center">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* ── Infos acheteur ── */}
                <section>
                  <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Acheteur</h2>
                  <div className="flex flex-col gap-3">

                    {/* Nom */}
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type="text" placeholder="Nom complet *" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full bg-bg-card border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-white/25 focus:border-violet-neon/50 focus:outline-none transition-colors" />
                    </div>

                    {/* Numéro Mobile Money */}
                    {paymentMethod !== 'CASH' && (
                      <div>
                        <div className="relative">
                          <Smartphone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${paymentMethod === 'MOOV_MONEY' ? 'text-blue-400' : 'text-red-400'}`} />
                          <input type="tel"
                            placeholder={`Numéro ${paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Airtel Money'} du client *`}
                            value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)}
                            className={`w-full bg-bg-card rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none transition-colors border ${paymentMethod === 'MOOV_MONEY' ? 'border-blue-400/30 focus:border-blue-400/70' : 'border-red-400/30 focus:border-red-400/70'}`}
                          />
                        </div>
                        <p className={`text-xs mt-1 pl-1 ${paymentMethod === 'MOOV_MONEY' ? 'text-blue-400/60' : 'text-red-400/60'}`}>
                          Le client reçoit une demande USSD et valide depuis son téléphone
                        </p>
                      </div>
                    )}

                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Barre de validation fixe ── */}
      {selectedEvent && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur-md border-t border-violet-neon/20 px-4 py-4 z-40">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-sm">{totalTickets} billet{totalTickets !== 1 ? 's' : ''}</span>
              <span className="font-bebas text-2xl tracking-wider text-white">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-xl bg-neon-gradient font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />}
              {isLoading
                ? 'Traitement...'
                : paymentMethod === 'CASH'
                  ? 'Valider — Espèces'
                  : `Envoyer demande — ${paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Airtel Money'}`
              }
            </button>
          </div>
        </div>
      )}

      {/* ══ OVERLAY : En attente de paiement ══ */}
      {showWaiting && (
        <div className="fixed inset-0 z-50 bg-bg/98 backdrop-blur-md flex flex-col">
          <div className="max-w-sm mx-auto w-full px-4 py-12 flex flex-col items-center text-center gap-6 flex-1 justify-center">

            {waitingFailed ? (
              /* ── État échec + retry ── */
              <>
                <div className="w-20 h-20 rounded-full bg-rose-neon/10 border border-rose-neon/20 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-rose-neon" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-1 text-rose-neon">Paiement refusé ou expiré</p>
                  <p className="text-white/50 text-sm">
                    Le client n'a pas validé à temps ou a annulé.
                  </p>
                  <p className="text-white font-mono text-base mt-2">{payerPhone}</p>
                </div>

                <button
                  onClick={handleRetry}
                  disabled={mobileMoneyMutation.isLoading}
                  className="w-full py-3.5 rounded-xl bg-neon-gradient font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {mobileMoneyMutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Réessayer — {opLabel}
                </button>

                <button
                  onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setShowWaiting(false); setWaitingFailed(false); }}
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler et changer de mode de paiement
                </button>
              </>
            ) : (
              /* ── État en attente ── */
              <>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${opColor}`}>
                  <Loader2 className={`w-10 h-10 animate-spin ${paymentMethod === 'MOOV_MONEY' ? 'text-blue-400' : 'text-red-400'}`} />
                </div>

                <div>
                  <p className="text-lg font-semibold mb-1">Demande envoyée — {opLabel}</p>
                  <p className="text-white/50 text-sm">Le client doit valider sur son téléphone</p>
                  <p className="text-white font-mono text-base mt-2">{payerPhone}</p>
                </div>

                <div className="glass-card p-4 w-full text-left">
                  <div className="flex items-center gap-2 mb-3 text-white/50">
                    <Smartphone className="w-4 h-4" />
                    <p className="text-xs font-semibold uppercase tracking-widest">Étapes pour le client</p>
                  </div>
                  <ol className="space-y-2 text-sm text-white/70">
                    <li className="flex gap-2"><span className={`font-semibold ${paymentMethod === 'MOOV_MONEY' ? 'text-blue-400' : 'text-red-400'}`}>1.</span> Demander au client de rester sur l'écran d'accueil pour ne pas manquer le pop-up USSD</li>
                    <li className="flex gap-2"><span className={`font-semibold ${paymentMethod === 'MOOV_MONEY' ? 'text-blue-400' : 'text-red-400'}`}>2.</span> Le client saisit son code secret pour valider le paiement</li>
                  </ol>
                </div>

                <div className="glass-card p-4 w-full text-center border border-violet-neon/10">
                  <p className="text-white/40 text-xs mb-1">Montant à payer</p>
                  <p className="font-bebas text-4xl tracking-wider text-violet-neon">{formatPrice(total)}</p>
                  <p className="text-white/30 text-xs mt-1">{totalTickets} billet{totalTickets !== 1 ? 's' : ''} · {selectedEvent?.title}</p>
                </div>

                <button
                  onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setShowWaiting(false); setPendingOrderId(null); }}
                  className="flex items-center gap-2 text-white/30 hover:text-rose-neon transition-colors text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler et revenir
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ OVERLAY : Billet succès ══ */}
      {showQR && saleResult && (
        <div className="fixed inset-0 z-50 bg-bg/98 backdrop-blur-md flex flex-col overflow-y-auto">
          <div className="max-w-xl mx-auto w-full px-4 py-8 flex flex-col items-center text-center gap-5">

            <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>

            <div>
              <p className="text-2xl font-bold mb-1">{formatPrice(saleResult.totalAmount)}</p>
              <p className="text-white/50 text-sm">Vente pour <span className="text-white">{saleResult.buyerName}</span></p>
            </div>

            {/* Billet complet ou QR en fallback */}
            <div className="glass-card p-3 w-full">
              {ticketImageLoading ? (
                <div className="flex items-center justify-center gap-3 py-10 text-white/40">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Génération du billet…</span>
                </div>
              ) : ticketImageSrc ? (
                <img
                  src={ticketImageSrc}
                  alt="Billet"
                  className="w-full rounded-lg"
                  style={{ aspectRatio: '900/380' }}
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3 text-violet-neon">
                    <QrCode className="w-4 h-4" />
                    <p className="text-sm font-medium">QR Code d'entrée</p>
                  </div>
                  <img
                    src={getQRImageUrl(saleResult.orderId, saleResult.qrToken)}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto rounded-xl bg-white p-2"
                  />
                </>
              )}

            </div>

            {/* ── Envoi WhatsApp ── */}
            <div className="w-full glass-card p-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Envoyer le billet sur WhatsApp</p>

              {/* Numéros déjà envoyés */}
              {saleWhatsApp && (
                <div className="flex items-center gap-2 mb-2 bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg px-3 py-1.5">
                  <Phone className="w-3 h-3 text-[#25D366]" />
                  <span className="text-[#25D366] text-xs font-medium flex-1">{saleWhatsApp}</span>
                  <span className="text-[#25D366]/60 text-xs">✓ Envoyé auto</span>
                </div>
              )}
              {waSentNumbers.map(n => (
                <div key={n} className="flex items-center gap-2 mb-2 bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg px-3 py-1.5">
                  <Phone className="w-3 h-3 text-[#25D366]" />
                  <span className="text-[#25D366] text-xs font-medium flex-1">{n}</span>
                  <span className="text-[#25D366]/60 text-xs">✓ Envoyé</span>
                </div>
              ))}

              {/* Champ + bouton envoi */}
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#25D366]/60" />
                  <input
                    type="tel"
                    placeholder="Autre numéro WhatsApp"
                    value={waResendPhone}
                    onChange={e => setWaResendPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleWaResend()}
                    className="w-full bg-bg border border-[#25D366]/30 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-white/25 focus:border-[#25D366]/70 focus:outline-none text-sm transition-colors"
                  />
                </div>
                <button
                  onClick={handleWaResend}
                  disabled={!waResendPhone.trim() || waResendSending}
                  className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  {waResendSending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                  Envoyer
                </button>
              </div>
            </div>

            {/* ── Envoi Email ── */}
            <div className="w-full glass-card p-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Envoyer le billet par email</p>

              {emailSentList.map(e => (
                <div key={e} className="flex items-center gap-2 mb-2 bg-violet-neon/10 border border-violet-neon/20 rounded-lg px-3 py-1.5">
                  <Mail className="w-3 h-3 text-violet-neon" />
                  <span className="text-violet-neon text-xs font-medium flex-1 truncate">{e}</span>
                  <span className="text-violet-neon/60 text-xs">✓ Envoyé</span>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-neon/60" />
                  <input
                    type="email"
                    placeholder="Email du client"
                    value={emailResend}
                    onChange={e => setEmailResend(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEmailResend()}
                    className="w-full bg-bg border border-violet-neon/30 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-white/25 focus:border-violet-neon/70 focus:outline-none text-sm transition-colors"
                  />
                </div>
                <button
                  onClick={handleEmailResend}
                  disabled={!emailResend.trim() || emailResendSending}
                  className="px-4 py-2.5 rounded-xl bg-violet-neon text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  {emailResendSending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                  Envoyer
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSaleResult(null); setSaleWhatsApp(''); setShowQR(false);
                setTicketImageSrc(null); setWaSentNumbers([]); setWaResendPhone('');
                setEmailSentList([]); setEmailResend('');
              }}
              className="w-full py-3 rounded-xl bg-neon-gradient font-semibold text-white"
            >
              Nouvelle vente
            </button>
          </div>
        </div>
      )}

      {/* ══ OVERLAY : Statistiques ══ */}
      {showStats && (
        <div className="fixed inset-0 z-50 bg-bg/98 backdrop-blur-md flex flex-col">
          <div className="sticky top-0 bg-bg/95 backdrop-blur-md border-b border-violet-neon/20 px-4 py-3 flex items-center justify-between">
            <p className="font-bebas text-xl tracking-wider text-violet-neon">MES VENTES</p>
            <button onClick={() => setShowStats(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <XCircle className="w-5 h-5 text-white/50" />
            </button>
          </div>

          <div className="max-w-xl mx-auto w-full px-4 py-6 overflow-y-auto flex-1">
            {statsLoading ? (
              <div className="text-center py-16 text-white/30">Chargement...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <ShoppingBag className="w-4 h-4 text-violet-neon" />
                      <span className="text-white/50 text-sm">Ventes</span>
                    </div>
                    <p className="font-bebas text-3xl tracking-wider text-white">{stats?.totalOrders ?? 0}</p>
                  </div>
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-4 h-4 text-violet-neon" />
                      <span className="text-white/50 text-sm">Chiffre d'affaires</span>
                    </div>
                    <p className="font-bebas text-2xl tracking-wider text-white">{formatPrice(stats?.totalRevenue ?? 0)}</p>
                  </div>
                </div>

                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Dernières ventes</h2>
                <div className="flex flex-col gap-2">
                  {stats?.recentSales.length === 0 && (
                    <p className="text-white/30 text-sm text-center py-8">Aucune vente pour l'instant</p>
                  )}
                  {stats?.recentSales.map((sale) => (
                    <div key={sale.id} className="glass-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{sale.buyerName}</p>
                          <p className="text-white/40 text-sm truncate">{sale.event.title}</p>
                          <p className="text-white/25 text-xs">{sale.orderItems.map((i) => `${i.quantity}× ${i.category.name}`).join(', ')}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="font-semibold text-violet-neon">{formatPrice(sale.totalAmount)}</p>
                          <p className="text-white/30 text-xs">{new Date(sale.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
