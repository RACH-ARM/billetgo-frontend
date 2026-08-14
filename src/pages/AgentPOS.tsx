import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'react-query';
import {
  ShoppingBag, Minus, Plus, User, Phone, Mail, CheckCircle,
  ChevronLeft, QrCode, LogOut, BarChart3, Ticket, RefreshCw,
  Banknote, Smartphone, Loader2, XCircle,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

function getQRImageUrl(orderId: string, qrToken: string) {
  return `${API_URL}/orders/${orderId}/qr-public?token=${qrToken}`;
}

// ─── Composants internes ──────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-violet-neon/10 border border-violet-neon/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-violet-neon" />
        </div>
        <span className="text-white/50 text-sm">{label}</span>
      </div>
      <p className="font-bebas text-3xl tracking-wider text-white">{value}</p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AgentPOS() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  type PaymentMethod = 'CASH' | 'MOOV_MONEY' | 'AIRTEL_MONEY';

  const [view, setView] = useState<'events' | 'sale' | 'success' | 'stats' | 'waiting'>('events');
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [payerPhone, setPayerPhone] = useState('');     // numéro Mobile Money
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [saleWhatsApp, setSaleWhatsApp] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const resetForm = () => {
    setQuantities({});
    setBuyerName('');
    setBuyerEmail('');
    setBuyerPhone('');
    setPayerPhone('');
    setPaymentMethod('CASH');
    setPendingOrderId(null);
  };

  // ── Polling statut paiement Mobile Money ───────────────────────────────────

  useEffect(() => {
    if (view !== 'waiting' || !pendingOrderId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/agent/orders/${pendingOrderId}/status`);
        const { status, qrToken } = res.data.data as { orderId: string; status: string; qrToken: string | null };

        if (status === 'COMPLETED' && qrToken) {
          clearInterval(pollRef.current!);
          setSaleResult({ orderId: pendingOrderId, qrToken, totalAmount: total, buyerName: buyerName.trim() });
          setSaleWhatsApp(payerPhone.trim()); // le numéro Mobile Money reçoit le QR
          setView('success');
          resetForm();
          refetchEvents();
        } else if (status === 'FAILED') {
          clearInterval(pollRef.current!);
          toast.error('Paiement refusé ou expiré. Le client doit réessayer.');
          setView('sale');
          setPendingOrderId(null);
        }
      } catch {
        // réseau — on continuera au prochain tick
      }
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pendingOrderId]);

  // ── Données ────────────────────────────────────────────────────────────────

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery<AgentEvent[]>(
    'agent-events',
    async () => {
      const res = await api.get('/agent/events');
      return res.data.data;
    },
    { refetchOnWindowFocus: false }
  );

  const { data: stats, isLoading: statsLoading } = useQuery<AgentStats>(
    'agent-stats',
    async () => {
      const res = await api.get('/agent/stats');
      return res.data.data;
    },
    { enabled: view === 'stats', refetchOnWindowFocus: false }
  );

  // ── Vente ──────────────────────────────────────────────────────────────────

  // Mutation espèces
  const saleMutation = useMutation(
    async () => {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([categoryId, quantity]) => ({ categoryId, quantity }));
      if (items.length === 0) throw new Error('Sélectionnez au moins un billet');
      if (!buyerName.trim()) throw new Error("Le nom de l'acheteur est requis");
      const res = await api.post('/agent/pos/sale', {
        eventId: selectedEvent!.id, items,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim() || undefined,
        buyerPhone: buyerPhone.trim() || undefined,
      });
      return res.data.data as SaleResult;
    },
    {
      onSuccess: (data) => {
        setSaleResult(data);
        setSaleWhatsApp(buyerPhone.trim());
        setView('success');
        resetForm();
        refetchEvents();
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur lors de la vente';
        toast.error(msg);
      },
    }
  );

  // Mutation Mobile Money
  const mobileMoneyMutation = useMutation(
    async () => {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([categoryId, quantity]) => ({ categoryId, quantity }));
      if (items.length === 0) throw new Error('Sélectionnez au moins un billet');
      if (!buyerName.trim()) throw new Error("Le nom de l'acheteur est requis");
      if (!payerPhone.trim()) throw new Error('Le numéro Mobile Money du client est requis');
      const res = await api.post('/agent/pos/mobile-money', {
        eventId: selectedEvent!.id, items,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim() || undefined,
        buyerPhone: buyerPhone.trim() || undefined,
        payerPhone: payerPhone.trim(),
        operator: paymentMethod,
      });
      return res.data.data as { orderId: string };
    },
    {
      onSuccess: (data) => {
        setPendingOrderId(data.orderId);
        setView('waiting');
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur lors de l\'initiation du paiement';
        toast.error(msg);
      },
    }
  );

  const handleSubmit = () => {
    if (paymentMethod === 'CASH') {
      saleMutation.mutate();
    } else {
      mobileMoneyMutation.mutate();
    }
  };

  // ── Calcul du total ────────────────────────────────────────────────────────

  const total = selectedEvent
    ? selectedEvent.ticketCategories.reduce((sum, cat) => {
        return sum + cat.price * (quantities[cat.id] ?? 0);
      }, 0)
    : 0;

  const totalTickets = Object.values(quantities).reduce((s, q) => s + q, 0);

  // ── Vue : Liste des événements ─────────────────────────────────────────────

  if (view === 'events') {
    return (
      <div className="min-h-screen bg-bg text-white">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-violet-neon/20 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-bebas text-xl tracking-wider text-violet-neon">AGENT POS</p>
            <p className="text-white/40 text-xs">{user?.firstName} {user?.lastName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('stats')}
              className="p-2 rounded-xl bg-bg-card border border-violet-neon/20 hover:border-violet-neon/50 transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-violet-neon" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-bg-card border border-white/10 hover:border-rose-500/50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">Mes événements</h1>
            <button
              onClick={() => refetchEvents()}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-white/40" />
            </button>
          </div>

          {eventsLoading && (
            <div className="text-center py-16 text-white/30">Chargement...</div>
          )}

          {!eventsLoading && (!events || events.length === 0) && (
            <div className="glass-card p-8 text-center">
              <Ticket className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Aucun événement assigné.</p>
              <p className="text-white/25 text-sm mt-1">Contactez l'administrateur.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {events?.map((event) => {
              const totalStock = event.ticketCategories.reduce((s, c) => s + c.available, 0);
              return (
                <button
                  key={event.id}
                  onClick={() => { setSelectedEvent(event); setQuantities({}); setView('sale'); }}
                  className="glass-card p-4 text-left hover:border-violet-neon/40 transition-colors w-full"
                >
                  <div className="flex gap-3">
                    {event.coverImageUrl ? (
                      <img src={event.coverImageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-violet-neon/10 flex items-center justify-center flex-shrink-0">
                        <Ticket className="w-6 h-6 text-violet-neon/40" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{event.title}</p>
                      <p className="text-white/40 text-sm">{formatEventDate(event.eventDate)}</p>
                      <p className="text-white/30 text-xs truncate">{event.venueName}</p>
                      <p className="text-violet-neon text-xs mt-1">{totalStock} billet{totalStock !== 1 ? 's' : ''} disponibles</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Vue : Statistiques ─────────────────────────────────────────────────────

  if (view === 'stats') {
    return (
      <div className="min-h-screen bg-bg text-white">
        <div className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-violet-neon/20 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setView('events')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <p className="font-bebas text-xl tracking-wider text-violet-neon">MES VENTES</p>
        </div>

        <div className="max-w-xl mx-auto px-4 py-6">
          {statsLoading ? (
            <div className="text-center py-16 text-white/30">Chargement...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard icon={ShoppingBag} label="Ventes" value={String(stats?.totalOrders ?? 0)} />
                <StatCard icon={BarChart3} label="Chiffre d'affaires" value={formatPrice(stats?.totalRevenue ?? 0)} />
              </div>

              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Dernières ventes</h2>
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
                        <p className="text-white/25 text-xs">
                          {sale.orderItems.map((i) => `${i.quantity}× ${i.category.name}`).join(', ')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-semibold text-violet-neon">{formatPrice(sale.totalAmount)}</p>
                        <p className="text-white/30 text-xs">
                          {new Date(sale.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Vue : Succès / QR Code ─────────────────────────────────────────────────

  if (view === 'success' && saleResult) {
    const qrUrl = getQRImageUrl(saleResult.orderId, saleResult.qrToken);
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col">
        <div className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-violet-neon/20 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setView('events')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <p className="font-bebas text-xl tracking-wider text-violet-neon">VENTE CONFIRMÉE</p>
        </div>

        <div className="max-w-sm mx-auto px-4 py-8 flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>

          <div>
            <p className="text-2xl font-bold mb-1">{formatPrice(saleResult.totalAmount)}</p>
            <p className="text-white/50">Vente pour <span className="text-white">{saleResult.buyerName}</span></p>
          </div>

          {/* QR Code */}
          <div className="glass-card p-4 w-full">
            <div className="flex items-center gap-2 mb-3 text-violet-neon">
              <QrCode className="w-4 h-4" />
              <p className="text-sm font-medium">QR Code d'entrée</p>
            </div>
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded-xl bg-white p-2"
            />
            {saleWhatsApp ? (
              <div className="mt-3 flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 rounded-lg px-3 py-2">
                <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                <p className="text-[#25D366] text-xs font-medium">
                  QR Code envoyé sur WhatsApp · {saleWhatsApp}
                </p>
              </div>
            ) : (
              <p className="text-white/30 text-xs mt-3">
                Montrez ce QR à l'acheteur pour qu'il le prenne en photo.
              </p>
            )}
          </div>

          <button
            onClick={() => { setSaleResult(null); setSaleWhatsApp(''); setSelectedEvent(null); setView('events'); }}
            className="w-full py-3 rounded-xl bg-neon-gradient font-semibold text-white"
          >
            Nouvelle vente
          </button>
        </div>
      </div>
    );
  }

  // ── Vue : Attente paiement Mobile Money ───────────────────────────────────

  if (view === 'waiting') {
    const opLabel = paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Airtel Money';
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col">
        <div className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-violet-neon/20 px-4 py-3 flex items-center gap-3">
          <p className="font-bebas text-xl tracking-wider text-violet-neon">EN ATTENTE DE PAIEMENT</p>
        </div>

        <div className="max-w-sm mx-auto px-4 py-12 flex flex-col items-center text-center gap-6">
          {/* Spinner */}
          <div className="w-20 h-20 rounded-full bg-violet-neon/10 border border-violet-neon/20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-violet-neon animate-spin" />
          </div>

          <div>
            <p className="text-lg font-semibold mb-1">Demande envoyée via {opLabel}</p>
            <p className="text-white/50 text-sm">
              Le client doit valider sur son téléphone
            </p>
            <p className="text-white font-mono text-base mt-2">{payerPhone}</p>
          </div>

          <div className="glass-card p-4 w-full text-left">
            <div className="flex items-center gap-2 mb-3 text-white/50">
              <Smartphone className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">Étapes pour le client</p>
            </div>
            <ol className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-violet-neon font-semibold">1.</span> Ouvrir l'app {opLabel} ou composer *150#</li>
              <li className="flex gap-2"><span className="text-violet-neon font-semibold">2.</span> Accepter la demande de paiement reçue</li>
              <li className="flex gap-2"><span className="text-violet-neon font-semibold">3.</span> Entrer son code secret</li>
            </ol>
          </div>

          <div className="glass-card p-4 w-full text-center border border-violet-neon/10">
            <p className="text-white/40 text-xs mb-1">Montant à payer</p>
            <p className="font-bebas text-4xl tracking-wider text-violet-neon">{formatPrice(total)}</p>
            <p className="text-white/30 text-xs mt-1">{totalTickets} billet{totalTickets !== 1 ? 's' : ''} · {selectedEvent?.title}</p>
          </div>

          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              setPendingOrderId(null);
              setView('sale');
            }}
            className="flex items-center gap-2 text-white/40 hover:text-rose-neon transition-colors text-sm"
          >
            <XCircle className="w-4 h-4" />
            Annuler et revenir
          </button>
        </div>
      </div>
    );
  }

  // ── Vue : Formulaire de vente ──────────────────────────────────────────────

  if (view === 'sale' && selectedEvent) {
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-violet-neon/20 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => { setView('events'); setQuantities({}); }}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{selectedEvent.title}</p>
            <p className="text-white/40 text-xs">{formatEventDate(selectedEvent.eventDate)} · {selectedEvent.venueName}</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-4 w-full flex flex-col gap-5 pb-40">

          {/* Sélection des billets */}
          <section>
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Billets</h2>
            <div className="flex flex-col gap-2">
              {selectedEvent.ticketCategories.map((cat) => {
                const qty = quantities[cat.id] ?? 0;
                const soldOut = cat.available === 0;
                return (
                  <div key={cat.id} className="glass-card p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-violet-neon text-sm font-semibold">{formatPrice(cat.price)}</p>
                      <p className="text-white/30 text-xs">
                        {soldOut ? 'Épuisé' : `${cat.available} disponibles`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setQuantities((q) => ({ ...q, [cat.id]: Math.max(0, (q[cat.id] ?? 0) - 1) }))}
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-lg bg-bg-card border border-white/10 flex items-center justify-center disabled:opacity-30 hover:border-violet-neon/50 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{qty}</span>
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

          {/* Mode de paiement */}
          <section>
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Mode de paiement</h2>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'CASH',        label: 'Espèces',     Icon: Banknote,    color: 'green' },
                { id: 'MOOV_MONEY',  label: 'Moov Money',  Icon: Smartphone,  color: 'blue'  },
                { id: 'AIRTEL_MONEY',label: 'Airtel Money', Icon: Smartphone,  color: 'red'   },
              ] as const).map(({ id, label, Icon, color }) => {
                const active = paymentMethod === id;
                const borderCls = active
                  ? color === 'green' ? 'border-green-500 bg-green-500/10 text-green-400'
                    : color === 'blue' ? 'border-blue-400 bg-blue-400/10 text-blue-300'
                    : 'border-red-400 bg-red-400/10 text-red-300'
                  : 'border-white/10 text-white/40 hover:border-white/25';
                return (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-colors ${borderCls}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] font-semibold leading-tight text-center">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Infos acheteur */}
          <section>
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Acheteur</h2>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Nom complet *"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-bg-card border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-white/25 focus:border-violet-neon/50 focus:outline-none transition-colors"
                />
              </div>

              {/* Champ numéro Mobile Money — uniquement si Moov ou Airtel */}
              {paymentMethod !== 'CASH' && (
                <>
                  <div className="relative">
                    <Smartphone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${paymentMethod === 'MOOV_MONEY' ? 'text-blue-400' : 'text-red-400'}`} />
                    <input
                      type="tel"
                      placeholder={`Numéro ${paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Airtel Money'} du client *`}
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      className={`w-full bg-bg-card rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none transition-colors border ${
                        paymentMethod === 'MOOV_MONEY'
                          ? 'border-blue-400/30 focus:border-blue-400/70'
                          : 'border-red-400/30 focus:border-red-400/70'
                      }`}
                    />
                  </div>
                  <p className={`text-xs -mt-1 pl-1 ${paymentMethod === 'MOOV_MONEY' ? 'text-blue-400/60' : 'text-red-400/60'}`}>
                    Une demande de paiement sera envoyée sur ce numéro. Le QR sera envoyé par WhatsApp après confirmation.
                  </p>
                </>
              )}

              {/* WhatsApp — uniquement pour les ventes espèces */}
              {paymentMethod === 'CASH' && (
                <>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#25D366]" />
                    <input
                      type="tel"
                      placeholder="Numéro WhatsApp du client (ex: 241XXXXXXXX)"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full bg-bg-card border border-[#25D366]/30 rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-white/25 focus:border-[#25D366]/70 focus:outline-none transition-colors"
                    />
                    {buyerPhone.trim() && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#25D366] bg-[#25D366]/10 px-1.5 py-0.5 rounded">
                        WhatsApp
                      </span>
                    )}
                  </div>
                  <p className="text-[#25D366]/60 text-xs -mt-1 pl-1">
                    Le QR Code sera envoyé automatiquement sur WhatsApp après la vente
                  </p>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  placeholder="Email (optionnel — envoi automatique)"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-bg-card border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-white/25 focus:border-violet-neon/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Barre de validation fixe en bas */}
        <div className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur-md border-t border-violet-neon/20 px-4 py-4">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-sm">{totalTickets} billet{totalTickets !== 1 ? 's' : ''}</span>
              <span className="font-bebas text-2xl tracking-wider text-white">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={
                saleMutation.isLoading || mobileMoneyMutation.isLoading ||
                totalTickets === 0 || !buyerName.trim() ||
                (paymentMethod !== 'CASH' && !payerPhone.trim())
              }
              className="w-full py-3.5 rounded-xl bg-neon-gradient font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {(saleMutation.isLoading || mobileMoneyMutation.isLoading) && (
                <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              )}
              {saleMutation.isLoading || mobileMoneyMutation.isLoading
                ? 'Traitement...'
                : paymentMethod === 'CASH'
                  ? 'Valider — Espèces'
                  : `Envoyer demande — ${paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Airtel Money'}`
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
