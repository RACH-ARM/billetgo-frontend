import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { markEmailVerified } = useAuthStore();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide ou incomplet.');
      return;
    }
    api.get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setMessage(res.data.message || 'Email vérifié !');
        setStatus('success');
        markEmailVerified();
      })
      .catch((err) => {
        setMessage(
          err?.response?.data?.message || 'Lien invalide ou déjà utilisé. Demandez un nouveau lien depuis votre compte.'
        );
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 w-full max-w-md text-center"
      >
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-violet-neon mx-auto mb-4 animate-spin" />
            <h1 className="font-bebas text-3xl tracking-wider text-white mb-2">VÉRIFICATION EN COURS</h1>
            <p className="text-white/40 text-sm">Validation de votre lien...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="font-bebas text-4xl tracking-wider text-gradient mb-2">EMAIL VÉRIFIÉ</h1>
            <p className="text-white/60 text-sm mb-8 leading-relaxed">{message}</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 rounded-xl bg-neon-gradient text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Retour à l'accueil
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-rose-neon/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-rose-neon" />
            </div>
            <h1 className="font-bebas text-4xl tracking-wider text-rose-neon mb-2">LIEN INVALIDE</h1>
            <p className="text-white/60 text-sm mb-8 leading-relaxed">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 rounded-xl border border-violet-neon/30 text-violet-neon font-semibold text-sm hover:border-violet-neon/60 transition-colors"
            >
              Se connecter
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
