import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ChevronLeft, CheckCircle2, Ticket } from 'lucide-react';
import api from '../services/api';
import Button from '../components/common/Button';

export default function GuestTicketLookup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/tickets/lookup', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Réessayez dans quelques instants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        {!sent ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-violet-neon/15 flex items-center justify-center flex-shrink-0">
                <Ticket className="w-5 h-5 text-violet-neon" />
              </div>
              <h1 className="font-bebas text-3xl tracking-wider text-gradient">RETROUVER MES BILLETS</h1>
            </div>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              Entrez l'email utilisé lors de votre achat. Nous vous enverrons un lien temporaire pour accéder à vos billets.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoFocus
                  className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                />
              </div>

              {error && (
                <p className="text-rose-neon text-sm">{error}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!isValidEmail}
                isLoading={loading}
                className="w-full"
              >
                <Mail className="w-4 h-4" />
                Envoyer le lien d'accès
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/5 space-y-2 text-center">
              <p className="text-xs text-white/30">Vous avez un compte BilletGab ?</p>
              <Link
                to="/login"
                className="text-violet-neon text-sm font-semibold hover:underline"
              >
                Se connecter
              </Link>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5"
          >
            <div className="w-16 h-16 rounded-full bg-green-400/15 border border-green-400/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="font-bebas text-2xl tracking-wider text-white mb-2">Email envoyé !</h2>
              <p className="text-white/55 text-sm leading-relaxed max-w-xs mx-auto">
                Si des billets sont associés à <span className="text-white/80">{email}</span>, vous recevrez un lien d'accès valable 24 heures.
              </p>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              Pensez à vérifier vos spams si vous ne voyez rien dans les 2 minutes.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-violet-neon text-sm hover:underline"
            >
              Essayer une autre adresse
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
