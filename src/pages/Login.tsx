import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
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
    const redirectTarget = searchParams.get('redirect');
    if (user?.role === 'BUYER' && redirectTarget) {
      navigate(decodeURIComponent(redirectTarget), { replace: true });
      return;
    }
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
      const errData = (err as { response?: { data?: { message?: string; lockedUntil?: string; googleAccount?: boolean } } })?.response?.data;
      const message = errData?.message || 'Identifiants invalides';
      if (errData?.lockedUntil) {
        startLockCountdown(errData.lockedUntil);
      } else if (errData?.googleAccount) {
        setIsGoogleAccount(true);
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
        <p className="text-white/50 text-sm mb-6">Content de te revoir sur BilletGab</p>

        <div className="relative group">
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-500/70 via-purple-500/70 to-rose-500/70 blur-sm opacity-70 animate-pulse group-hover:opacity-100 transition-opacity" />
          <button
            type="button"
            onClick={() => {
              const redirectTarget = searchParams.get('redirect');
              if (redirectTarget) localStorage.setItem('auth_redirect', redirectTarget);
              const base = import.meta.env.VITE_BACKEND_URL ?? import.meta.env.VITE_API_URL ?? '/api/v1';
              window.location.href = `${base}/api/v1/auth/google?origin=${encodeURIComponent(window.location.origin)}`;
            }}
            className="relative w-full flex items-center justify-center gap-3 rounded-xl border border-violet-neon/30 bg-[#0D0D1A] hover:bg-white/5 px-4 py-3 text-sm text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#0D0D1A] px-3 text-xs text-white/30 uppercase tracking-widest">ou avec un email</span>
          </div>
        </div>

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

          {isGoogleAccount && (
            <div className="rounded-xl bg-violet-neon/10 border border-violet-neon/30 px-4 py-3 space-y-3">
              <p className="text-white/80 text-sm">Ce compte utilise la connexion Google. Tu peux te connecter directement ou définir un mot de passe via "Mot de passe oublié".</p>
              <button
                type="button"
                onClick={() => {
                  const base = import.meta.env.VITE_API_URL ?? '/api/v1';
                  window.location.href = `${base}/auth/google?origin=${encodeURIComponent(window.location.origin)}`;
                }}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm text-white/80 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </button>
            </div>
          )}

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
