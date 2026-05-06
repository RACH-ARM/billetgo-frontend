import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, Ticket } from 'lucide-react';
import api from '../services/api';
import Button from '../components/common/Button';

export default function GuestTicketLookup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/tickets/by-email', { email: email.trim().toLowerCase() });
      navigate('/mes-billets', { state: { guestData: data.data } });
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

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-violet-neon/15 flex items-center justify-center flex-shrink-0">
            <Ticket className="w-5 h-5 text-violet-neon" />
          </div>
          <h1 className="font-bebas text-3xl tracking-wider text-gradient">RETROUVER MES BILLETS</h1>
        </div>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          Entrez l'email utilisé lors de votre achat pour accéder directement à vos billets.
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
            <Search className="w-4 h-4" />
            Accéder à mes billets
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
      </motion.div>
    </div>
  );
}
