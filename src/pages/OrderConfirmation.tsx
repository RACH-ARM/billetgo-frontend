import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, Ticket,
  CalendarDays, MapPin, HelpCircle, RefreshCw, Share2, Mail,
  Smartphone, AlertCircle, Check,
} from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { useQueryClient } from 'react-query';
import { formatEventDate } from '../utils/formatDate';
import { playPaymentSuccess } from '../utils/sounds';
import { formatPrice } from '../utils/formatPrice';
import { normalizeGabonPhone, isValidGabonPhone, isPhoneMatchingProvider } from '../utils/phone';
import Button from '../components/common/Button';
import type { PaymentProvider } from '../types/ticket';

// ─── Types ─────────────────────────────────────────────────────────────────────
type ConfirmationState = 'WAITING' | 'SUCCESS' | 'FAILURE' | 'RETRYABLE_FAILURE' | 'TIMEOUT' | 'UNAUTHORIZED';

type FailureType = 'insufficient_funds' | 'user_cancelled' | 'other';

function classifyClientFailure(failureReason: string | null): FailureType {
  if (!failureReason) return 'other';
  const r = failureReason.toUpperCase();
  if (r.includes('INSUFFI') || r.includes('SOLDE') || r.includes('BALANCE')) return 'insufficient_funds';
  if (r.includes('CANCEL') || r.includes('ANNUL')) return 'user_cancelled';
  return 'other';
}

const PROVIDERS = [
  { id: 'AIRTEL_MONEY' as const, name: 'Airtel Money', color: 'text-rose-neon', border: 'border-rose-neon', bg: 'bg-rose-neon/10' },
  { id: 'MOOV_MONEY' as const, name: 'Moov Money', color: 'text-cyan-neon', border: 'border-cyan-neon', bg: 'bg-cyan-neon/10' },
];

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface NavState {
  paymentId: string | null;
  eventName: string;
  eventDate: string;
  venueName: string;
  coverImageUrl: string | null;
  amount: number;
  ticketsCount: number;
  provider: PaymentProvider;
  orderItems: OrderItem[];
}

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_WAIT_MS = 2 * 60 * 1000; // 2 minutes
const POLL_INTERVAL_MS = 3000;
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'billetgab01@gmail.com';

// ─── Waiting animation ────────────────────────────────────────────────────────
function WaitingRings() {
  return (
    <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-violet-neon/25"
          animate={{ scale: [1, 1.45 + i * 0.22], opacity: [0.5, 0] }}
          transition={{ duration: 2.5, delay: i * 0.85, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        className="relative w-20 h-20 bg-neon-gradient rounded-full flex items-center justify-center shadow-neon"
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Ticket className="w-9 h-9 text-white" />
      </motion.div>
    </div>
  );
}

// ─── Success icon ─────────────────────────────────────────────────────────────
function SuccessIcon() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="relative w-24 h-24 mx-auto"
    >
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full bg-neon-gradient"
          animate={{ scale: [1, 1.7 + i * 0.3], opacity: [0.25, 0] }}
          transition={{ duration: 1.2, delay: 0.4 + i * 0.3, ease: 'easeOut' }}
        />
      ))}
      <div className="w-24 h-24 bg-neon-gradient rounded-full flex items-center justify-center shadow-neon">
        <CheckCircle2 className="w-11 h-11 text-white" />
      </div>
    </motion.div>
  );
}

// ─── Info block (inside SUCCESS state) ───────────────────────────────────────
function InfoBlock() {
  return (
    <div className="glass-card p-5 border border-violet-neon/15 space-y-4">
      <h3 className="font-bebas text-lg tracking-wider text-violet-neon flex items-center gap-2">
        <HelpCircle className="w-5 h-5" />
        Où et comment utiliser vos billets ?
      </h3>
      <div className="space-y-4 text-sm">
        {[
          {
            n: '1',
            title: 'Retrouver vos billets',
            body: "Sur mobile : appuyez sur l'icône billet dans la barre de navigation en haut. Sur ordinateur : cliquez sur \"Mes billets\" dans le menu de votre compte.",
          },
          {
            n: '2',
            title: "Le jour de l'événement",
            body: "Allez dans \"Mes billets\", affichez votre QR code et présentez votre écran à l'entrée. Vous pouvez aussi l'enregistrer en image dans votre galerie pour un accès hors connexion.",
          },
          {
            n: '3',
            title: 'Durée d\'accès',
            body: "Vos billets restent disponibles dans votre compte sans limite de temps, tant que votre compte BilletGab existe.",
          },
        ].map(({ n, title, body }) => (
          <div key={n} className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-violet-neon/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-violet-neon text-[10px] font-bold">{n}</span>
            </div>
            <div>
              <p className="text-white/80 font-semibold">{title}</p>
              <p className="text-white/50 mt-0.5 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        to="/comment-ca-marche"
        className="inline-flex items-center gap-1.5 text-violet-neon text-sm font-semibold hover:underline mt-1"
      >
        <HelpCircle className="w-4 h-4" />
        Guide complet — Comment utiliser mes billets ?
      </Link>
    </div>
  );
}

// ─── Guard : accès direct à l'URL sans passer par le checkout ────────────────
export default function OrderConfirmation() {
  const location = useLocation();
  if (!location.state) return <Navigate to="/" replace />;
  return <OrderConfirmationInner />;
}

// ─── Main page ────────────────────────────────────────────────────────────────
function OrderConfirmationInner() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const state = location.state as NavState;

  const [confirmationState, setConfirmationState] = useState<ConfirmationState>('WAITING');
  const [failureType, setFailureType] = useState<FailureType>('other');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(state?.paymentId ?? null);

  // Retry form state
  const [retryProvider, setRetryProvider] = useState<'AIRTEL_MONEY' | 'MOOV_MONEY' | null>(state?.provider ?? null);
  const [retryPhone, setRetryPhone] = useState('');
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling loop
  useEffect(() => {
    if (confirmationState !== 'WAITING') return;

    // No paymentId — fallback to 2-min timer
    if (!currentPaymentId) {
      timeoutRef.current = setTimeout(() => setConfirmationState('TIMEOUT'), MAX_WAIT_MS);
      return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }

    const paymentId = currentPaymentId;
    let attempts = 0;
    const MAX_ATTEMPTS = Math.floor(MAX_WAIT_MS / POLL_INTERVAL_MS);

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const result = await paymentService.getPaymentStatus(paymentId);
        if (result.status === 'SUCCESS') {
          clearInterval(pollRef.current!);
          setConfirmationState('SUCCESS');
          playPaymentSuccess();
          queryClient.invalidateQueries('my-tickets');
        } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
          clearInterval(pollRef.current!);
          const ft = classifyClientFailure(result.failureReason);
          setFailureType(ft);
          // Retryable = order still PENDING (pas POLLING_TIMEOUT) + pas expiré
          const isRetryable =
            result.orderStatus === 'PENDING' &&
            !result.failureReason?.includes('POLLING_TIMEOUT') &&
            (result.orderExpiresAt ? new Date(result.orderExpiresAt) > new Date() : false);
          setConfirmationState(isRetryable ? 'RETRYABLE_FAILURE' : 'FAILURE');
        } else if (attempts >= MAX_ATTEMPTS) {
          clearInterval(pollRef.current!);
          setConfirmationState('TIMEOUT');
        }
      } catch {
        // ignore transient network errors
      }
    }, POLL_INTERVAL_MS);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [confirmationState, currentPaymentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = async () => {
    if (!orderId || !retryProvider || !isValidGabonPhone(retryPhone) || !isPhoneMatchingProvider(retryPhone, retryProvider)) return;
    setRetryLoading(true);
    setRetryError(null);
    try {
      const result = await paymentService.initiatePayment({
        orderId,
        method: retryProvider,
        phone: normalizeGabonPhone(retryPhone) ?? retryPhone,
      });
      setCurrentPaymentId(result?.paymentId ?? null);
      setConfirmationState('WAITING');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; code?: string } } })?.response?.data;
      if (errData?.code === 'NO_STOCK') {
        // Plus de places disponibles — rediriger vers la liste des événements
        navigate('/evenements', { replace: true });
        return;
      }
      setRetryError(errData?.message || 'Erreur lors du paiement. Réessayez.');
    } finally {
      setRetryLoading(false);
    }
  };

  const supportUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Problème commande ${orderId ?? ''}`)}&body=${encodeURIComponent(`Bonjour BilletGab,\n\nJ'ai un problème avec ma commande ${orderId ?? ''}.\n\nPouvez-vous m'aider ?\n\nMerci`)}`;


  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">

          {/* ── WAITING ── */}
          {confirmationState === 'WAITING' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-center space-y-8"
            >
              <WaitingRings />

              <div>
                <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-white mb-2">
                  Traitement en cours…
                </h1>
                <p className="text-white/55 text-sm max-w-xs mx-auto leading-relaxed">
                  {state?.provider === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'} vous envoie
                  une demande de confirmation. Validez sur votre téléphone et patientez quelques
                  secondes.
                </p>
              </div>

              {/* Récapitulatif rassurant */}
              {state && (
                <div className="glass-card p-4 border border-violet-neon/20 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Événement</span>
                    <span className="text-white font-semibold line-clamp-1 max-w-[60%] text-right">
                      {state.eventName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Montant</span>
                    <span className="text-cyan-neon font-mono font-bold">{formatPrice(state.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Billets</span>
                    <span className="text-white">
                      {state.ticketsCount} billet{state.ticketsCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Ne fermez pas cette page avant la confirmation</span>
              </div>

              {orderId && (
                <p className="text-white/15 font-mono text-xs">Réf : {orderId}</p>
              )}
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {confirmationState === 'SUCCESS' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4">
                <SuccessIcon />
                <div>
                  <h1 className="font-bebas text-4xl sm:text-5xl tracking-wide text-gradient mb-1">
                    Paiement confirmé !
                  </h1>
                  <p className="text-white/55 text-sm">
                    Vos billets sont prêts. Bon événement !
                  </p>
                </div>
              </div>

              {/* Récapitulatif complet */}
              {state && (
                <div className="glass-card p-5 border border-violet-neon/20 space-y-3">
                  {state.coverImageUrl && (
                    <img
                      src={state.coverImageUrl}
                      alt={state.eventName}
                      className="w-full h-32 object-cover object-top rounded-xl opacity-80"
                    />
                  )}
                  <h2 className="font-bebas text-xl tracking-wider text-white">{state.eventName}</h2>
                  <div className="flex items-center gap-1.5 text-white/50 text-sm">
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    {formatEventDate(state.eventDate)}
                  </div>
                  <div className="flex items-center gap-1.5 text-white/50 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    {state.venueName}
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-1.5">
                    {state.orderItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-white/60">{item.name} ×{item.quantity}</span>
                        <span className="font-mono text-white/80">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-white/5">
                      <span className="text-white">Total payé</span>
                      <span className="font-mono text-cyan-neon">{formatPrice(state.amount)}</span>
                    </div>
                  </div>

                  {orderId && (
                    <p className="text-white/20 font-mono text-xs pt-1">Réf : {orderId}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/mes-billets', { replace: true })}
              >
                <Ticket className="w-4 h-4" />
                Voir mes billets
              </Button>

              {/* Calendrier + partage */}
              {state && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      const start = new Date(state.eventDate);
                      const end = new Date(start.getTime() + 4 * 3600_000);
                      const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                      const ics = [
                        'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
                        `SUMMARY:${state.eventName}`,
                        `DTSTART:${fmt(start)}`,
                        `DTEND:${fmt(end)}`,
                        `LOCATION:${state.venueName}`,
                        `DESCRIPTION:Billet BilletGab — Réf: ${orderId}`,
                        'END:VEVENT', 'END:VCALENDAR',
                      ].join('\r\n');
                      const blob = new Blob([ics], { type: 'text/calendar' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `${state.eventName.replace(/\s+/g, '-')}.ics`;
                      a.click();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:border-violet-neon/40 hover:text-violet-neon transition-all text-sm font-semibold"
                  >
                    <CalendarDays className="w-4 h-4" />
                    Ajouter au calendrier
                  </button>
                  <button
                    onClick={() => {
                      const text = `Je viens d'acheter mes billets pour ${state.eventName} ! Rejoins-moi sur BilletGab : ${window.location.origin}/evenements`;
                      if (navigator.share) {
                        navigator.share({ title: state.eventName, text }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(text).then(() => {
                          import('react-hot-toast').then(({ default: toast }) => toast.success('Lien copié !'));
                        });
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:border-violet-neon/40 hover:text-violet-neon transition-all text-sm font-semibold"
                  >
                    <Share2 className="w-4 h-4" />
                    Partager
                  </button>
                </div>
              )}

              <InfoBlock />
            </motion.div>
          )}

          {/* ── TIMEOUT ── */}
          {confirmationState === 'TIMEOUT' && (
            <motion.div
              key="timeout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 mx-auto bg-violet-neon/10 border-2 border-violet-neon/30 rounded-full flex items-center justify-center">
                <Clock className="w-11 h-11 text-violet-neon" />
              </div>

              <div>
                <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-white mb-2">
                  Vérification en cours
                </h1>
                <p className="text-white/55 text-sm max-w-sm mx-auto leading-relaxed">
                  La confirmation prend plus de temps que prévu. Vos billets apparaîtront
                  automatiquement dans "Mes billets" dès que le paiement sera validé.
                </p>
              </div>

              {orderId && (
                <p className="text-white/20 font-mono text-xs">Réf : {orderId}</p>
              )}

              <div className="flex flex-col gap-3">
                <Button variant="primary" size="lg" onClick={() => navigate('/mes-billets', { replace: true })}>
                  <Ticket className="w-4 h-4" />
                  Vérifier dans mes billets
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  Retour à l'accueil
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── RETRYABLE FAILURE (solde insuffisant / annulé) ── */}
          {confirmationState === 'RETRYABLE_FAILURE' && (
            <motion.div
              key="retryable-failure"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Alerte contextuelle */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-neon/10 border border-rose-neon/30">
                <AlertCircle className="w-5 h-5 text-rose-neon flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-rose-neon font-semibold text-sm">
                    {failureType === 'insufficient_funds' ? 'Solde insuffisant' :
                     failureType === 'user_cancelled' ? 'Paiement annulé' : 'Paiement non abouti'}
                  </p>
                  <p className="text-white/55 text-sm mt-0.5 leading-relaxed">
                    {failureType === 'insufficient_funds'
                      ? 'Votre compte Mobile Money ne dispose pas de fonds suffisants. Rechargez votre compte puis retentez le paiement ci-dessous.'
                      : failureType === 'user_cancelled'
                      ? 'Vous avez annulé la confirmation. Vos places sont toujours réservées — retentez le paiement ci-dessous.'
                      : 'Le paiement n\'a pas abouti. Vos places sont toujours réservées — retentez ci-dessous ou changez d\'opérateur.'}
                  </p>
                </div>
              </div>

              {/* Formulaire de retry */}
              <div className="glass-card p-5 space-y-4">
                <h2 className="font-bebas text-xl tracking-wider text-white">Retenter le paiement</h2>

                {/* Opérateur */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">
                    Opérateur <span className="text-rose-neon">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setRetryProvider(p.id); setRetryPhone(''); }}
                        className={`relative flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          retryProvider === p.id ? `${p.border} ${p.bg}` : 'border-white/10 hover:border-violet-neon/30'
                        }`}
                      >
                        {retryProvider === p.id && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-neon-gradient rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${p.bg}`}>
                          <Smartphone className={`w-3.5 h-3.5 ${p.color}`} />
                        </div>
                        <span className={`font-bebas text-sm tracking-wider ${p.color}`}>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numéro */}
                {retryProvider && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">
                      Numéro {retryProvider === 'AIRTEL_MONEY' ? 'Airtel' : 'Moov'} <span className="text-rose-neon">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 bg-bg-secondary border border-violet-neon/20 rounded-xl px-3 py-2.5 text-white/60 text-sm flex-shrink-0">
                        <span>🇬🇦</span><span>+241</span>
                      </div>
                      <input
                        value={retryPhone}
                        onChange={(e) => setRetryPhone(e.target.value)}
                        type="tel"
                        autoFocus
                        placeholder={retryProvider === 'AIRTEL_MONEY' ? '07X XXX XXX' : '06X XXX XXX'}
                        className="flex-1 bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                      />
                    </div>
                    {retryPhone.length >= 2 && isValidGabonPhone(retryPhone) && !isPhoneMatchingProvider(retryPhone, retryProvider) && (
                      <p className="text-xs text-rose-neon mt-1">
                        Ce numéro ne correspond pas à {retryProvider === 'AIRTEL_MONEY' ? 'Airtel (07X...)' : 'Moov (06X...)'}
                      </p>
                    )}
                  </motion.div>
                )}

                {retryError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-neon/10 border border-rose-neon/30">
                    <XCircle className="w-4 h-4 text-rose-neon flex-shrink-0 mt-0.5" />
                    <p className="text-rose-neon text-sm">{retryError}</p>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRetry}
                  disabled={!retryProvider || !isValidGabonPhone(retryPhone) || !isPhoneMatchingProvider(retryPhone, retryProvider ?? 'AIRTEL_MONEY')}
                  isLoading={retryLoading}
                >
                  <RefreshCw className="w-4 h-4" />
                  Payer {state?.amount != null ? formatPrice(state.amount) : ''}
                </Button>
              </div>

              {orderId && <p className="text-white/15 font-mono text-xs text-center">Réf : {orderId}</p>}

              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Annuler — Retour à l'accueil
              </Button>
            </motion.div>
          )}

          {/* ── FAILURE (définitif — timeout polling) ── */}
          {confirmationState === 'FAILURE' && (
            <motion.div
              key="failure"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="w-24 h-24 mx-auto bg-rose-neon/10 border-2 border-rose-neon/30 rounded-full flex items-center justify-center"
              >
                <XCircle className="w-11 h-11 text-rose-neon" />
              </motion.div>

              <div>
                <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-white mb-2">
                  Paiement non abouti
                </h1>
                <p className="text-white/55 text-sm max-w-sm mx-auto leading-relaxed">
                  Aucun montant n'a été débité de votre compte Mobile Money. Si un débit
                  a été effectué par erreur, un remboursement automatique sera traité sous
                  24 à 48 heures.
                </p>
              </div>

              {orderId && (
                <p className="text-white/20 font-mono text-xs">Réf : {orderId}</p>
              )}

              <div className="flex flex-col gap-3">
                <Button variant="primary" size="lg" onClick={() => navigate('/checkout')}>
                  <RefreshCw className="w-4 h-4" />
                  Recommencer l'achat
                </Button>
                <a
                  href={supportUrl}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-all text-sm font-semibold"
                >
                  <Mail className="w-4 h-4" />
                  Contacter le support
                </a>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  Retour à l'accueil
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── UNAUTHORIZED ── */}
          {confirmationState === 'UNAUTHORIZED' && (
            <motion.div
              key="unauthorized"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 mx-auto bg-rose-neon/10 border-2 border-rose-neon/30 rounded-full flex items-center justify-center">
                <XCircle className="w-11 h-11 text-rose-neon" />
              </div>
              <div>
                <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-white mb-2">
                  Accès refusé
                </h1>
                <p className="text-white/55 text-sm max-w-sm mx-auto leading-relaxed">
                  Cette page de confirmation n'est pas accessible directement. Si vous cherchez vos billets, consultez votre espace personnel.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="primary" size="lg" onClick={() => navigate('/mes-billets', { replace: true })}>
                  <Ticket className="w-4 h-4" />
                  Mes billets
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  Retour à l'accueil
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
