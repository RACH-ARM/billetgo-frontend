import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowDownToLine, Loader2, CheckCircle2,
  AlertTriangle, ChevronRight, Banknote, Receipt, Smartphone, Check,
} from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import { normalizeGabonPhone, isValidGabonPhone, isPhoneMatchingProvider } from '../../utils/phone';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WithdrawContext {
  grossAmount: number;
  airtelPayoutRate: number;
  moovPayoutRate: number;
  label: string;
}

interface Props {
  context: WithdrawContext | null;
  onConfirm: (phone: string, operator: 'AIRTEL_MONEY' | 'MOOV_MONEY', amount: number) => Promise<{ message?: string }>;
  onClose: () => void;
}

const PROVIDERS = [
  { id: 'AIRTEL_MONEY' as const, name: 'Airtel Money', color: 'text-rose-neon', border: 'border-rose-neon', bg: 'bg-rose-neon/10' },
  { id: 'MOOV_MONEY'  as const, name: 'Moov Money',   color: 'text-cyan-neon', border: 'border-cyan-neon', bg: 'bg-cyan-neon/10'  },
];

// Plafonds journaliers opérateurs — comptes non vérifiés (Gabon)
const DAILY_LIMITS: Record<'AIRTEL_MONEY' | 'MOOV_MONEY', number> = {
  AIRTEL_MONEY: 1_500_000,
  MOOV_MONEY:   3_000_000,
};
const CHUNK_MAX = 500_000;

// ─── Step 1 : Choix montant + opérateur + numéro ─────────────────────────────

function PaymentStep({
  ctx,
  onNext,
  onClose,
}: {
  ctx: WithdrawContext;
  onNext: (phone: string, operator: 'AIRTEL_MONEY' | 'MOOV_MONEY', amount: number) => void;
  onClose: () => void;
}) {
  const amount = ctx.grossAmount;
  const [provider, setProvider] = useState<'AIRTEL_MONEY' | 'MOOV_MONEY' | null>(null);
  const [phone, setPhone]       = useState('');

  const phoneValid = provider !== null && isValidGabonPhone(phone) && isPhoneMatchingProvider(phone, provider);
  const mismatch   = provider !== null && phone.length >= 2 && isValidGabonPhone(phone) && !isPhoneMatchingProvider(phone, provider);

  const rate = provider === 'MOOV_MONEY' ? ctx.moovPayoutRate : ctx.airtelPayoutRate;
  const fee  = Math.round(amount * rate);
  const net  = amount - fee;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Retrait</p>
        <p className="font-semibold text-white truncate">{ctx.label}</p>
      </div>

      {/* Récap montant fixe */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-white/50"><Banknote className="w-4 h-4 text-white/25" />Montant disponible</span>
          <span className="font-mono font-bold text-white">{formatPrice(amount, 'FCFA', '0 FCFA')}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-white/50"><Receipt className="w-4 h-4 text-white/25" />Frais PVit ({Math.round(rate * 100)}%)</span>
          <span className="font-mono text-rose-neon/70">− {formatPrice(fee, 'FCFA', '0 FCFA')}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5 bg-violet-neon/[0.04]">
          <span className="text-sm font-bold text-white">Vous recevez</span>
          <span className="font-mono font-bold text-xl text-violet-neon">{formatPrice(net, 'FCFA', '0 FCFA')}</span>
        </div>
      </div>

      {/* Notes limites opérateur */}
      {provider && amount > CHUNK_MAX && (() => {
        const dailyLimit = DAILY_LIMITS[provider];
        const chunks = Math.ceil(amount / CHUNK_MAX);
        const exceedsDaily = amount > dailyLimit;
        const maxToday = Math.min(amount, dailyLimit);
        const chunksToday = Math.floor(dailyLimit / CHUNK_MAX);
        const remainder = amount - maxToday;

        return (
          <div className="space-y-2">
            {/* Toujours : info multi-virements */}
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white/80">Virement découpé en {chunks} opérations</p>
                <p className="text-xs text-white/45 leading-relaxed">
                  {provider === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'} plafonne chaque opération à 500 000 FCFA. Votre retrait de {formatPrice(amount, 'FCFA', '0 FCFA')} sera envoyé en {chunks} virements successifs, l'un après l'autre, vers votre numéro.
                </p>
                <p className="text-xs text-white/30 leading-relaxed">
                  Si un virement échoue en cours de route, les fonds déjà envoyés sont acquis. Le solde restant reste disponible sur votre tableau de bord pour un prochain retrait.
                </p>
              </div>
            </div>

            {/* Si dépassement limite journalière */}
            {exceedsDaily && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-300">Plafond journalier {provider === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'} atteint</p>
                  <p className="text-xs text-amber-200/70 leading-relaxed">
                    {provider === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'} limite les réceptions à {formatPrice(dailyLimit, 'FCFA')} par jour sur un compte non vérifié.
                    Aujourd'hui, seulement {chunksToday} virement{chunksToday > 1 ? 's' : ''} ({formatPrice(maxToday, 'FCFA')}) pourront être traités.
                  </p>
                  <p className="text-xs text-amber-200/50 leading-relaxed">
                    Le solde de {formatPrice(remainder, 'FCFA')} restera disponible sur votre tableau de bord et pourra être retiré dès demain.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Choix opérateur */}
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-2.5">Choisir l'opérateur</p>
        <div className="grid grid-cols-2 gap-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => { setProvider(p.id); setPhone(''); }}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                provider === p.id ? `${p.border} ${p.bg}` : 'border-white/10 hover:border-white/20'
              }`}
            >
              {provider === p.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-neon-gradient rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${p.bg}`}>
                <Smartphone className={`w-4 h-4 ${p.color}`} />
              </div>
              <span className={`font-bebas text-base tracking-wider ${p.color}`}>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Saisie numéro */}
      <AnimatePresence mode="wait">
        {provider && (
          <motion.div
            key={provider}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            <p className="text-xs text-white/50 uppercase tracking-widest">
              Numéro {provider === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'} à créditer
              <span className="text-rose-neon ml-1">*</span>
            </p>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white/50 text-sm flex-shrink-0">
                <span>🇬🇦</span>
                <span>+241</span>
              </div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                autoFocus
                placeholder={provider === 'AIRTEL_MONEY' ? '07X XXX XXX' : '06X XXX XXX'}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-neon/60 transition-colors"
              />
            </div>
            {mismatch && (
              <p className="text-xs text-rose-neon">
                Ce numéro ne correspond pas à {provider === 'AIRTEL_MONEY' ? 'Airtel Money (07X...)' : 'Moov Money (06X...)'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={() => {
            const normalized = normalizeGabonPhone(phone);
            if (provider && normalized) onNext(normalized, provider, amount);
          }}
          disabled={!phoneValid}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-violet-neon text-white font-bold text-sm hover:bg-violet-neon/85 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Vérifier et continuer <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="w-full py-2.5 rounded-2xl text-sm text-white/35 hover:text-white hover:bg-white/5 transition-all">
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Step 2 : Confirmation avant envoi ───────────────────────────────────────

function ConfirmStep({
  ctx,
  amount,
  phone,
  operator,
  onConfirm,
  onBack,
}: {
  ctx: WithdrawContext;
  amount: number;
  phone: string;
  operator: 'AIRTEL_MONEY' | 'MOOV_MONEY';
  onConfirm: () => Promise<void>;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const rate    = operator === 'MOOV_MONEY' ? ctx.moovPayoutRate : ctx.airtelPayoutRate;
  const fee     = Math.round(amount * rate);
  const net     = amount - fee;
  const opMeta  = PROVIDERS.find((p) => p.id === operator)!;

  const handle = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Une erreur est survenue. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Confirmer le virement</p>
        <p className="font-semibold text-white truncate">{ctx.label}</p>
      </div>

      {/* Récap */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] divide-y divide-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-white/50">Montant brut</span>
          <span className="font-mono font-bold text-white text-sm">{formatPrice(amount, 'FCFA')}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-white/50">Opérateur</span>
          <span className={`font-semibold text-sm ${opMeta.color}`}>{opMeta.name}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-white/50">Numéro</span>
          <span className="font-mono text-white text-sm">{phone}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-white/50">Frais PVit</span>
          <span className="font-mono text-rose-neon/70 text-sm">− {formatPrice(fee, 'FCFA')}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-4 bg-violet-neon/[0.04]">
          <span className="font-bold text-white">Vous recevez</span>
          <span className="font-mono font-bold text-2xl text-violet-neon">{formatPrice(net, 'FCFA')}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={handle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-violet-neon text-white font-bold text-sm hover:bg-violet-neon/85 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement…</>
            : <><ArrowDownToLine className="w-4 h-4" /> Confirmer le virement</>
          }
        </button>
        <button onClick={onBack} disabled={loading} className="w-full py-2.5 rounded-2xl text-sm text-white/35 hover:text-white hover:bg-white/5 transition-all">
          Modifier
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 : Succès ─────────────────────────────────────────────────────────

function SuccessStep({ net, phone, message, onClose }: { net: number; phone: string; message: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-5 py-2">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center"
      >
        <CheckCircle2 className="w-8 h-8 text-green-400" />
      </motion.div>

      <div>
        <p className="font-bebas text-3xl tracking-wider text-gradient leading-none">{formatPrice(net, 'FCFA')}</p>
        <p className="text-sm text-white/50 mt-1">{message}</p>
      </div>

      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <Smartphone className="w-4 h-4 text-green-400 flex-shrink-0" />
        <p className="font-mono text-white/70 text-sm">{phone}</p>
      </div>

      <p className="text-xs text-white/25 leading-relaxed">
        Virement en cours de traitement par votre opérateur.<br />
        Vous recevrez un SMS de confirmation sous quelques minutes.
      </p>

      <button
        onClick={onClose}
        className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white font-semibold hover:bg-white/10 active:scale-[0.98] transition-all"
      >
        Fermer
      </button>
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

type Step = 'payment' | 'confirm' | 'success';

export default function WithdrawModal({ context, onConfirm, onClose }: Props) {
  const [step, setStep]           = useState<Step>('payment');
  const [phone, setPhone]         = useState('');
  const [operator, setOperator]   = useState<'AIRTEL_MONEY' | 'MOOV_MONEY' | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [successMsg, setSuccessMsg]         = useState('');
  const [netReceived, setNetReceived]       = useState(0);

  const handleNext = (p: string, op: 'AIRTEL_MONEY' | 'MOOV_MONEY', amt: number) => {
    setPhone(p);
    setOperator(op);
    setSelectedAmount(amt);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!operator || !phone || !context) return;
    const result = await onConfirm(phone, operator, selectedAmount);
    const rate = operator === 'MOOV_MONEY' ? context.moovPayoutRate : context.airtelPayoutRate;
    setNetReceived(selectedAmount - Math.round(selectedAmount * rate));
    setSuccessMsg(result.message ?? `Virement initié vers ${phone}`);
    setStep('success');
  };

  const handleClose = () => {
    onClose();
    // Reset après fermeture
    setTimeout(() => { setStep('payment'); setPhone(''); setOperator(null); setSuccessMsg(''); }, 300);
  };

  return (
    <AnimatePresence>
      {context && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step === 'success' ? handleClose : undefined}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-4"
          >
            <div className="w-full sm:max-w-md glass-card border border-white/10 rounded-3xl p-6 relative max-h-[90svh] overflow-y-auto">
              {step !== 'success' && (
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <AnimatePresence mode="wait">
                {step === 'payment' && (
                  <motion.div key="payment" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <PaymentStep ctx={context} onNext={handleNext} onClose={handleClose} />
                  </motion.div>
                )}
                {step === 'confirm' && operator && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <ConfirmStep
                      ctx={context}
                      amount={selectedAmount}
                      phone={phone}
                      operator={operator}
                      onConfirm={handleConfirm}
                      onBack={() => setStep('payment')}
                    />
                  </motion.div>
                )}
                {step === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <SuccessStep net={netReceived} phone={phone} message={successMsg} onClose={handleClose} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
