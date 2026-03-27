import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '../components/common/Button';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Entrez un email valide');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch {
      toast.error('Erreur serveur. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-violet-neon/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-violet-neon" />
            </div>
            <h1 className="font-bebas text-3xl tracking-wider text-white">EMAIL ENVOYÉ</h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Si un compte existe avec l'adresse <span className="text-white">{email}</span>, vous recevrez un lien de réinitialisation valable <strong className="text-white">1 heure</strong>.
            </p>
            <p className="text-white/30 text-xs">Vérifiez aussi vos spams.</p>
            <Link to="/login" className="block mt-6 text-violet-neon hover:text-rose-neon transition-colors text-sm">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <Link to="/login" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <h1 className="font-bebas text-4xl tracking-wider text-gradient mb-2">MOT DE PASSE OUBLIÉ</h1>
            <p className="text-white/50 text-sm mb-8">Entrez votre email et nous vous enverrons un lien de réinitialisation.</p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest block mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                  />
                </div>
                <p className="text-xs text-white/30 mt-1">Entrez l'email associé à votre compte BilletGo</p>
              </div>

              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
                Envoyer le lien
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
