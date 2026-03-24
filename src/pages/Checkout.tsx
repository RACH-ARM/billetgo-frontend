import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check, ChevronLeft, Ticket, Smartphone, User, CreditCard,
  ArrowRight, Trash2, CalendarDays, MapPin, CheckCircle, X, Info, Clock,
} from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useCreateOrder, useInitiatePayment } from '../hooks/usePayment';
import { useEvent } from '../hooks/useEvents';
import { formatPrice } from '../utils/formatPrice';
import { formatEventDate } from '../utils/formatDate';
import { normalizeGabonPhone, isValidGabonPhone } from '../utils/phone';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3;

const STEPS = [
  { label: 'Récapitulatif', Icon: Ticket },
  { label: 'Informations', Icon: User },
  { label: 'Paiement', Icon: CreditCard },
  { label: 'Confirmation', Icon: Check },
];

const PROVIDERS = [
  {
    id: 'AIRTEL_MONEY' as const,
    name: 'Airtel Money',
    color: 'text-rose-neon',
    border: 'border-rose-neon',
    bg: 'bg-rose-neon/10',
  },
  {
    id: 'MOOV_MONEY' as const,
    name: 'Moov Money',
    color: 'text-cyan-neon',
    border: 'border-cyan-neon',
    bg: 'bg-cyan-neon/10',
  },
];

export default function Checkout() {
  const [step, setStep] = useState<Step>(1);
  const { event, items, getTotalAmount, removeItem, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [buyerInfo, setBuyerInfo] = useState({
    name: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
    email: user?.email ?? '',
    phone: '',
  });
  const [provider, setProvider] = useState<'AIRTEL_MONEY' | 'MOOV_MONEY'>('AIRTEL_MONEY');
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ id: string; code: string; discountType: string; discountValue: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const createOrder = useCreateOrder();
  const initiatePayment = useInitiatePayment();
  const { data: freshEvent } = useEvent(event?.id ?? '');

  // Timer 15 min — persiste via sessionStorage pour survivre aux refreshs
  const CART_TTL = 5 * 60; // secondes
  const CART_EXPIRY_KEY = 'checkout_expiry';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getInitialTimeLeft = () => {
    const stored = sessionStorage.getItem(CART_EXPIRY_KEY);
    if (stored) {
      const remaining = Math.floor((Number(stored) - Date.now()) / 1000);
      if (remaining > 0) return remaining;
      return 0;
    }
    const expiry = Date.now() + CART_TTL * 1000;
    sessionStorage.setItem(CART_EXPIRY_KEY, String(expiry));
    return CART_TTL;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft);

  useEffect(() => {
    if (!event || items.length === 0) {
      navigate('/');
      return;
    }
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    timerRef.current = setInterval(() => {
      const remaining = Math.floor((Number(sessionStorage.getItem(CART_EXPIRY_KEY)) - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        sessionStorage.removeItem(CART_EXPIRY_KEY);
        setIsExpired(true);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rediriger si le panier devient vide après suppression d'un article (pas si session expirée — l'écran d'expiration gère la navigation)
  useEffect(() => {
    if (items.length === 0 && !isExpired) navigate('/');
  }, [items.length, isExpired, navigate]);

  const timerMin = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const timerSec = String(timeLeft % 60).padStart(2, '0');
  const timerUrgent = timeLeft < 120;

  if (!event || items.length === 0) return null;

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md w-full p-10 flex flex-col items-center text-center gap-6"
        >
          <div className="w-20 h-20 rounded-full bg-rose-neon/10 border border-rose-neon/30 flex items-center justify-center">
            <Clock className="w-10 h-10 text-rose-neon" />
          </div>
          <div>
            <h2 className="font-bebas text-3xl tracking-wider text-white mb-2">Session expirée</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Votre panier est réservé pendant 5 minutes. Ce délai est écoulé et les billets ont été libérés.
            </p>
          </div>
          <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            {event.coverImageUrl && (
              <img src={event.coverImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="text-left min-w-0">
              <p className="text-white font-semibold text-sm truncate">{event.title}</p>
              <p className="text-white/40 text-xs">{formatEventDate(event.eventDate)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Link
              to={`/events/${event.id}`}
              onClick={() => { clearCart(); sessionStorage.removeItem('checkout_expiry'); }}
              className="neon-button w-full text-center py-3 rounded-xl font-semibold"
            >
              Recommencer l'achat
            </Link>
            <Link
              to="/"
              onClick={() => { clearCart(); sessionStorage.removeItem('checkout_expiry'); }}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const rawTotal = getTotalAmount();
  const discountAmount = promoApplied
    ? promoApplied.discountType === 'PERCENT'
      ? rawTotal * (promoApplied.discountValue / 100)
      : Math.min(promoApplied.discountValue, rawTotal)
    : 0;
  const finalTotal = Math.max(0, rawTotal - discountAmount);

  // Frais de traitement pour billets gratuits uniquement (500 FCFA/billet, à la charge de l'acheteur)
  const FREE_TICKET_FEE = 500;
  const freeTicketFee = items.reduce((acc, item) => {
    return acc + (item.category.price === 0 ? item.quantity * FREE_TICKET_FEE : 0);
  }, 0);
  const totalToPay = Math.max(0, finalTotal + freeTicketFee);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const { data } = await import('../services/api').then(m => m.default.post('/orders/validate-promo', {
        code: promoInput.trim(),
        eventId: event.id,
      }));
      setPromoApplied(data.data);
      toast.success(`Code "${data.data.code}" appliqué !`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Code invalide');
    } finally {
      setPromoLoading(false);
    }
  };

  // Validation stock en temps réel via les données fraîches de l'événement
  const soldOutItems = freshEvent
    ? items.filter((item) => {
        const freshCat = freshEvent.ticketCategories.find((c) => c.id === item.category.id);
        if (!freshCat) return false;
        const available = freshCat.quantityTotal - freshCat.quantitySold - (freshCat.quantityReserved ?? 0);
        return available < item.quantity;
      })
    : [];
  const hasStockIssue = soldOutItems.length > 0;

  const phoneValid = isValidGabonPhone(buyerInfo.phone);
  const canProceedStep2 = buyerInfo.name.trim().length >= 2 && phoneValid;
  const canPay = paymentPhone.trim().length >= 8;

  const handlePayment = async () => {
    try {
      const order = await createOrder.mutateAsync({
        eventId: event.id,
        items: items.map((i) => ({ categoryId: i.category.id, quantity: i.quantity })),
        buyerName: buyerInfo.name,
        buyerEmail: buyerInfo.email || undefined,
        buyerPhone: normalizeGabonPhone(buyerInfo.phone) ?? buyerInfo.phone,
        cgvAcceptedAt: new Date().toISOString(),
        ...(promoApplied && { promoCode: promoApplied.code }),
      });

      const result = await initiatePayment.mutateAsync({
        orderId: order.id,
        method: provider,
        phone: paymentPhone,
      });

      // DEV uniquement : déclencher l'auto-paiement en arrière-plan via le proxy Vite
      if (result?.paymentUrl) {
        fetch(result.paymentUrl).catch(() => {});
      }

      sessionStorage.removeItem('checkout_expiry');
      navigate(`/confirmation/${order.id}`, {
        replace: true,
        state: {
          paymentId: result?.paymentId ?? null,
          eventName: event.title,
          eventDate: event.eventDate,
          venueName: event.venueName,
          coverImageUrl: event.coverImageUrl ?? null,
          amount: finalTotal,
          ticketsCount: items.reduce((s, i) => s + i.quantity, 0),
          provider,
          orderItems: items.map((i) => ({
            name: i.category.name,
            quantity: i.quantity,
            price: i.category.price,
          })),
        },
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; code?: string } }; code?: string };
      const status = axiosErr.response?.status;
      const isConnectionError = !axiosErr.response || axiosErr.code === 'ERR_NETWORK' || (status != null && status >= 500 && !axiosErr.response.data?.message);
      if (isConnectionError) {
        toast.error('Connexion impossible. Vérifiez votre réseau et réessayez.');
        return;
      }
      const response = axiosErr.response!.data;
      if (response?.code === 'ORDER_EXPIRED') {
        setIsExpired(true);
      } else if (response?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Vérifiez votre email avant d\'acheter. Consultez votre boîte mail.', { duration: 6000 });
      } else {
        toast.error(response?.message || 'Erreur lors du paiement');
      }
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              to={`/events/${event.id}`}
              className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </Link>
            <h1 className="font-bebas text-3xl sm:text-4xl tracking-wider text-gradient">
              ACHAT DE BILLETS
            </h1>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold transition-colors ${timerUrgent ? 'border-rose-neon/60 text-rose-neon bg-rose-neon/10 animate-pulse' : 'border-white/10 text-white/50'}`}>
            <Clock className="w-3.5 h-3.5" />
            {timerMin}:{timerSec}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== LEFT — Steps ===== */}
          <div className="lg:col-span-2">
            {/* Stepper */}
            {step < 4 && (
              <div className="flex items-center mb-8">
                {STEPS.slice(0, 3).map(({ label, Icon }, i) => {
                  const stepNum = (i + 1) as Step;
                  const isDone = step > stepNum;
                  const isActive = step === stepNum;
                  return (
                    <div key={label} className="flex items-center flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isDone ? 'bg-neon-gradient' :
                          isActive ? 'bg-violet-neon shadow-neon' :
                          'bg-bg-card border border-violet-neon/20'
                        }`}>
                          {isDone
                            ? <Check className="w-4 h-4 text-white" />
                            : <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/30'}`} />
                          }
                        </div>
                        <span className={`hidden sm:block text-xs font-semibold ${isActive ? 'text-white' : isDone ? 'text-white/60' : 'text-white/25'}`}>
                          {label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div className={`flex-1 h-px mx-3 ${isDone ? 'bg-violet-neon' : 'bg-violet-neon/15'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ── Step 1 : Récapitulatif ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-4"
                >
                  <div className="glass-card p-5">
                    {/* Event header */}
                    <div className="flex items-start gap-4 mb-5 pb-5 border-b border-white/5">
                      {event.coverImageUrl ? (
                        <img src={event.coverImageUrl} alt={event.title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }} />
                      )}
                      <div>
                        <h2 className="font-bebas text-xl tracking-wider text-white">{event.title}</h2>
                        <p className="flex items-center gap-1.5 text-white/50 text-sm mt-1">
                          <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                          {formatEventDate(event.eventDate)}
                        </p>
                        <p className="flex items-center gap-1.5 text-white/50 text-sm mt-0.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {event.venueName}
                        </p>
                      </div>
                    </div>

                    {/* Alerte stock insuffisant */}
                    {hasStockIssue && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-neon/10 border border-rose-neon/30 flex items-start gap-2">
                        <X className="w-4 h-4 text-rose-neon flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-rose-neon text-sm font-semibold">Stock insuffisant</p>
                          <p className="text-white/50 text-xs mt-0.5">
                            {soldOutItems.map((i) => {
                              const freshCat = freshEvent?.ticketCategories.find((c) => c.id === i.category.id);
                              const available = freshCat
                                ? freshCat.quantityTotal - freshCat.quantitySold - (freshCat.quantityReserved ?? 0)
                                : 0;
                              return `${i.category.name} : ${available > 0 ? `plus que ${available} place${available > 1 ? 's' : ''} disponible${available > 1 ? 's' : ''}` : 'COMPLET'}`;
                            }).join(' · ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Items list */}
                    <div className="space-y-1 mb-4">
                      {items.map((item) => {
                        const freshCat = freshEvent?.ticketCategories.find((c) => c.id === item.category.id);
                        const available = freshCat
                          ? freshCat.quantityTotal - freshCat.quantitySold - (freshCat.quantityReserved ?? 0)
                          : Infinity;
                        const isItemSoldOut = available < item.quantity;
                        return (
                        <div key={item.category.id} className={`flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 ${isItemSoldOut ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-8 rounded-full flex-shrink-0 ${isItemSoldOut ? 'bg-rose-neon' : 'bg-violet-neon'}`} />
                            <div>
                              <p className="text-white text-sm font-semibold">{item.category.name}{isItemSoldOut && <span className="ml-2 text-rose-neon text-xs">COMPLET</span>}</p>
                              <p className="text-white/40 text-xs">× {item.quantity} · {formatPrice(item.category.price)} / billet</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-cyan-neon font-bold text-sm">
                              {formatPrice(item.category.price * item.quantity)}
                            </span>
                            <button
                              onClick={() => removeItem(item.category.id)}
                              className="text-white/20 hover:text-rose-neon transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>

                    {/* Récapitulatif financier détaillé */}
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <div className="flex justify-between text-sm text-white/60">
                        <span>Sous-total</span>
                        <span className="font-mono">{formatPrice(rawTotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-400">
                          <span>Remise ({promoApplied?.code})</span>
                          <span className="font-mono">- {formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      {freeTicketFee > 0 && (
                        <div className="flex justify-between items-center text-sm text-white/40">
                          <span className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            Frais de traitement billets gratuits
                          </span>
                          <span className="font-mono">{formatPrice(freeTicketFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="font-semibold text-white">Total à payer</span>
                        <span className="font-mono text-lg font-bold text-gradient">{formatPrice(totalToPay)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Code promo */}
                  <div className="glass-card p-4 border border-violet-neon/10">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Code promo</p>
                    {promoApplied ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-mono font-bold">{promoApplied.code}</span>
                          <span>— {promoApplied.discountType === 'PERCENT' ? `${promoApplied.discountValue}%` : formatPrice(promoApplied.discountValue)} de réduction</span>
                        </div>
                        <button onClick={() => setPromoApplied(null)} className="text-white/30 hover:text-rose-neon transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                          placeholder="VOTRECODE"
                          className="flex-1 bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 text-white placeholder-white/20 font-mono text-sm focus:outline-none focus:border-violet-neon transition-colors"
                        />
                        <button
                          onClick={applyPromo}
                          disabled={promoLoading || !promoInput.trim()}
                          className="px-4 py-2.5 rounded-xl bg-violet-neon/20 border border-violet-neon/40 text-violet-neon hover:bg-violet-neon/30 text-sm font-semibold transition-colors disabled:opacity-40"
                        >
                          {promoLoading ? '...' : 'Appliquer'}
                        </button>
                      </div>
                    )}
                  </div>

                  <Button variant="primary" size="lg" className="w-full" onClick={() => setStep(2)} disabled={hasStockIssue}>
                    Continuer <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {/* ── Step 2 : Informations ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-4"
                >
                  <div className="glass-card p-6 space-y-5">
                    <h2 className="font-bebas text-xl tracking-wider text-white">Vos informations</h2>

                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">
                        Nom complet <span className="text-rose-neon">*</span>
                      </label>
                      <input
                        value={buyerInfo.name}
                        onChange={(e) => setBuyerInfo((b) => ({ ...b, name: e.target.value }))}
                        placeholder="Jean Dupont"
                        className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">
                        Email <span className="text-white/30">(optionnel)</span>
                      </label>
                      <input
                        value={buyerInfo.email}
                        onChange={(e) => setBuyerInfo((b) => ({ ...b, email: e.target.value }))}
                        type="email"
                        placeholder="jean@exemple.com"
                        className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">
                        Numéro WhatsApp <span className="text-rose-neon">*</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-3 text-white/60 text-sm flex-shrink-0">
                          <span>🇬🇦</span>
                          <span>+241</span>
                        </div>
                        <input
                          value={buyerInfo.phone}
                          onChange={(e) => setBuyerInfo((b) => ({ ...b, phone: e.target.value }))}
                          type="tel"
                          placeholder="XX XX XX XX"
                          className={`flex-1 bg-bg-secondary border rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none transition-colors ${
                            buyerInfo.phone && !phoneValid
                              ? 'border-rose-neon focus:border-rose-neon'
                              : 'border-violet-neon/20 focus:border-violet-neon'
                          }`}
                        />
                      </div>
                      {buyerInfo.phone && !phoneValid ? (
                        <p className="text-rose-neon text-xs mt-1.5">
                          Numéro invalide — ex : 62 55 76 55 (8 chiffres après +241)
                        </p>
                      ) : (
                        <p className="text-white/30 text-xs mt-1.5">
                          Votre QR Code sera envoyé sur ce numéro WhatsApp
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" onClick={() => setStep(1)} className="flex-1">
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setStep(3)}
                      disabled={!canProceedStep2}
                      className="flex-1"
                    >
                      Continuer <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3 : Paiement ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-4"
                >
                  <div className="glass-card p-6 space-y-5">
                    <h2 className="font-bebas text-xl tracking-wider text-white">Mode de paiement Mobile Money</h2>

                    <div className="grid grid-cols-2 gap-3">
                      {PROVIDERS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setProvider(p.id)}
                          className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                            provider === p.id ? `${p.border} ${p.bg}` : 'border-white/10 hover:border-violet-neon/30'
                          }`}
                        >
                          {provider === p.id && (
                            <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-neon-gradient rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.bg}`}>
                            <Smartphone className={`w-5 h-5 ${p.color}`} />
                          </div>
                          <span className={`font-bebas text-lg tracking-wider ${p.color}`}>{p.name}</span>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">
                        Numéro {provider === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'} <span className="text-rose-neon">*</span>
                      </label>
                      <p className="text-xs text-rose-neon/80 mb-2">
                        Renseignez le numéro {provider === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'} qui sera débité — ce n'est pas forcément votre numéro d'inscription.
                      </p>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-3 text-white/60 text-sm flex-shrink-0">
                          <span>🇬🇦</span>
                          <span>+241</span>
                        </div>
                        <input
                          value={paymentPhone}
                          onChange={(e) => setPaymentPhone(e.target.value)}
                          type="tel"
                          placeholder="01 00 00 00"
                          className="flex-1 bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                        />
                      </div>
                      <p className="text-xs text-white/30 mt-1.5">
                        Une notification de confirmation sera envoyée sur ce numéro.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 bg-violet-neon/5 border border-violet-neon/20 rounded-xl p-3">
                      <CreditCard className="w-4 h-4 text-violet-neon flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/50">
                        Paiement sécurisé. Vous recevrez une demande de confirmation sur votre téléphone.
                        Après validation, un email de confirmation est envoyé et vos billets sont disponibles dans "Mes billets" — les QR codes ne sont accessibles que sur BilletGo.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cgvAccepted}
                      onChange={(e) => setCgvAccepted(e.target.checked)}
                      className="mt-0.5 accent-violet-500 w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-xs text-white/50 leading-relaxed">
                      J'ai lu et j'accepte les{' '}
                      <Link to="/cgv" target="_blank" className="text-violet-neon hover:underline">Conditions Générales de Vente</Link>.
                      Je reconnais que les billets sont non remboursables sauf annulation de l'événement.
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" onClick={() => setStep(2)} className="flex-1">
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handlePayment}
                      disabled={!canPay || !cgvAccepted}
                      isLoading={createOrder.isLoading || initiatePayment.isLoading}
                      className="flex-1"
                    >
                      Payer {formatPrice(totalToPay)}
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ===== RIGHT — Order recap sidebar (desktop only) ===== */}
          <div className="hidden lg:block">
            <div className="glass-card p-5 sticky top-24">
              <h3 className="font-bebas text-lg tracking-wider text-white mb-4">Récapitulatif</h3>

              <div className="flex gap-3 mb-4 pb-4 border-b border-white/5">
                {event.coverImageUrl ? (
                  <img src={event.coverImageUrl} alt={event.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }} />
                )}
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm line-clamp-2">{event.title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{event.venueCity}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.category.id} className="flex justify-between text-sm">
                    <span className="text-white/60 truncate pr-2">{item.category.name} ×{item.quantity}</span>
                    <span className="font-mono text-white/80 flex-shrink-0">{formatPrice(item.category.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-3 border-t border-white/5">
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-400">
                    <span>Remise</span>
                    <span className="font-mono">- {formatPrice(discountAmount)}</span>
                  </div>
                )}
                {freeTicketFee > 0 && (
                  <div className="flex justify-between text-xs text-white/35">
                    <span>Frais traitement billets gratuits</span>
                    <span className="font-mono">{formatPrice(freeTicketFee)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                  <span className="text-white font-semibold text-sm">Total</span>
                  <span className="font-mono font-bold text-cyan-neon">{formatPrice(totalToPay)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
