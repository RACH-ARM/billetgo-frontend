import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
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

  const validate = () => {
    const e: typeof errors = {};
    if (!identifier.trim()) e.identifier = 'Email ou téléphone requis';
    if (password.length < 8) e.password = 'Mot de passe : 8 caractères minimum';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const redirectAfterLogin = () => {
    const { user } = useAuthStore.getState();
    const redirects: Record<string, string> = {
      BUYER: '/',
      ORGANIZER: '/dashboard',
      ADMIN: '/admin',
      SCANNER: '/scanner',
    };
    navigate(user ? (redirects[user.role] ?? '/') : '/');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const isEmail = identifier.includes('@');
    const payload = isEmail
      ? { email: identifier.trim(), password }
      : { phone: identifier.trim(), password };
    setSubmitLoading(true);
    try {
      const { data } = await api.post('/auth/login', payload);
      const { user: u, accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      useAuthStore.setState({ user: u, accessToken, refreshToken, isAuthenticated: true });
      toast.success('Connexion réussie !');
      redirectAfterLogin();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; lockedUntil?: string } } })?.response?.data;
      const message = errData?.message || 'Identifiants invalides';
      if (errData?.lockedUntil) {
        startLockCountdown(errData.lockedUntil);
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const inputCls = "w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <h1 className="font-bebas text-4xl tracking-wider text-gradient mb-2">CONNEXION</h1>
        <p className="text-white/50 text-sm mb-8">Content de te revoir sur BilletGo</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-widest block mb-1.5">
              Email ou téléphone
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ton@email.com ou +241XXXXXXXX"
              className={inputCls}
            />
            {errors.identifier && <p className="text-rose-neon text-xs mt-1">{errors.identifier}</p>}
            <p className="text-xs text-white/30 mt-1">L'adresse email ou le numéro avec lequel vous vous êtes inscrit</p>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-widest block mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputCls} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-rose-neon text-xs mt-1">{errors.password}</p>}
            <p className="text-xs text-white/30 mt-1">Mot de passe choisi lors de votre inscription</p>
          </div>

          <div className="flex justify-end">
            <Link to="/mot-de-passe-oublie" className="text-xs text-white/40 hover:text-violet-neon transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>

          {lockSecondsLeft > 0 && (
            <div className="rounded-xl bg-rose-neon/10 border border-rose-neon/30 px-4 py-3 text-center">
              <p className="text-rose-neon text-sm font-semibold">Compte temporairement verrouillé</p>
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
            className="w-full mt-2"
          >
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-violet-neon hover:text-rose-neon transition-colors">
            S'inscrire
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
