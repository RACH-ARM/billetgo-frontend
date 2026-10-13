import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/common/Button';

// Page de connexion par code d'accès — unique pour SCANNER et AGENT (vendeur).
// Un seul code d'accès existe par compte, et il porte son rôle avec lui : le
// backend (/auth/scanner-access) accepte les deux rôles sur le même endpoint,
// et la redirection suit le rôle réellement renvoyé — pas une page dédiée par
// rôle. Avoir deux pages séparées ("accès scanner" / "accès vendeur") aurait
// été trompeur puisqu'un code vendeur fonctionne tout aussi bien tapé ici.
export default function ScannerAccess() {
  const navigate = useNavigate();
  const { loginWithTokens } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (lockTimerRef.current) clearInterval(lockTimerRef.current); };
  }, []);

  const startLockCountdown = (lockedUntil: string) => {
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    const tick = () => {
      const secs = Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000));
      setLockSecondsLeft(secs);
      if (secs === 0 && lockTimerRef.current) clearInterval(lockTimerRef.current);
    };
    tick();
    lockTimerRef.current = setInterval(tick, 1000);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError('Code d\'accès requis'); return; }
    setSubmitLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/scanner-access', { code: code.trim() });
      loginWithTokens(data.data.user, data.data.accessToken, data.data.refreshToken);
      navigate(data.data.user.role === 'AGENT' ? '/pos' : '/scanner', { replace: true });
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string; lockedUntil?: string } } })?.response;
      if (response?.status === 429 && response.data?.lockedUntil) {
        startLockCountdown(response.data.lockedUntil);
      }
      setError(response?.data?.message || 'Code d\'accès invalide');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <div className="w-12 h-12 rounded-xl bg-cyan-neon/10 border border-cyan-neon/20 flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6 text-cyan-neon" />
        </div>
        <h1 className="font-bebas text-4xl tracking-wider text-gradient mb-2">ACCÈS PAR CODE</h1>
        <p className="text-white/50 text-sm mb-6">
          Pour les agents de scan et les vendeurs (point de vente). Entrez le code communiqué par l'organisateur ou l'administrateur — la page reconnaît automatiquement s'il s'agit d'un code scanner ou vendeur et vous envoie au bon endroit.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-widest block mb-1.5">Code d'accès</label>
            <input
              type="text"
              autoFocus
              autoCapitalize="characters"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XXXX-XXXX"
              className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white text-center font-mono text-2xl tracking-[0.3em] placeholder-white/15 focus:outline-none focus:border-violet-neon transition-colors uppercase"
            />
            {error && <p className="text-rose-neon text-xs mt-1.5 text-center">{error}</p>}
          </div>

          {lockSecondsLeft > 0 && (
            <div className="rounded-xl bg-rose-neon/10 border border-rose-neon/30 px-4 py-3 text-center">
              <p className="text-rose-neon text-sm font-semibold">Poste temporairement verrouillé</p>
              <p className="text-white/50 text-xs mt-1">
                Réessayez dans{' '}
                <span className="font-mono text-white/80">
                  {String(Math.floor(lockSecondsLeft / 60)).padStart(2, '0')}
                  :{String(lockSecondsLeft % 60).padStart(2, '0')}
                </span>
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={submitLoading}
            disabled={lockSecondsLeft > 0}
            className="w-full mt-2"
          >
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Vous avez un compte avec téléphone ou email ?{' '}
          <Link to="/login" className="text-violet-neon hover:text-rose-neon transition-colors">
            Connexion classique
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
