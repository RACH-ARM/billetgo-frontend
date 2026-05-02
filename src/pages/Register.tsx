import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { registerSchema, type RegisterFormData } from '../utils/validateForm';
import { normalizeGabonPhone } from '../utils/phone';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

export default function Register() {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'organizer' ? 'ORGANIZER' : 'BUYER';
  const [role, setRole] = useState<'BUYER' | 'ORGANIZER'>(defaultRole);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [cgoAccepted, setCgoAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const phone = data.phone ? (normalizeGabonPhone(data.phone) ?? undefined) : undefined;
      await registerUser({
        ...data,
        phone,
        role,
        cguAcceptedAt: new Date().toISOString(),
        ...(role === 'ORGANIZER' && { contractAcceptedAt: new Date().toISOString() }),
      });
      if (data.email) {
        toast.success('Compte créé ! Vérifiez votre email pour activer votre compte.', { duration: 5000 });
      } else {
        toast.success('Compte créé ! Bienvenue sur BilletGab.');
      }
      if (role === 'ORGANIZER') {
        navigate('/dashboard');
      } else {
        const redirectTarget = localStorage.getItem('auth_redirect') || searchParams.get('redirect');
        if (redirectTarget) {
          localStorage.removeItem('auth_redirect');
          navigate(decodeURIComponent(redirectTarget), { replace: true });
        } else {
          navigate('/');
        }
      }
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: { message: string }[] } } })?.response?.data;
      const message = res?.errors?.[0]?.message || res?.message || 'Erreur lors de l\'inscription';
      toast.error(message);
    }
  };

  const inputClass = "w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors";
  const labelClass = "text-xs text-white/50 uppercase tracking-widest block mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <h1 className="font-bebas text-4xl tracking-wider text-gradient mb-2">INSCRIPTION</h1>
        <p className="text-white/50 text-sm mb-6">Crée ton compte BilletGab en 30 secondes</p>

        {/* Role selector */}
        <div className="flex gap-2 mb-6">
          {(['BUYER', 'ORGANIZER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${role === r ? 'bg-neon-gradient text-white' : 'bg-bg-secondary border border-violet-neon/20 text-white/50'}`}
            >
              {r === 'BUYER' ? 'Acheteur' : 'Organisateur'}
            </button>
          ))}
        </div>

        {role === 'BUYER' && (
          <>
            <div className="relative group mb-2">
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
            <div className="relative mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0D0D1A] px-3 text-xs text-white/30 uppercase tracking-widest">ou avec un email</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Prénom</label>
              <input {...register('firstName')} placeholder="Votre prénom" className={inputClass} />
              {errors.firstName && <p className="text-rose-neon text-xs mt-1">{errors.firstName.message}</p>}
              <p className="text-xs text-white/30 mt-1">Affiché sur vos billets</p>
            </div>
            <div>
              <label className={labelClass}>Nom</label>
              <input {...register('lastName')} placeholder="Votre nom" className={inputClass} />
              {errors.lastName && <p className="text-rose-neon text-xs mt-1">{errors.lastName.message}</p>}
              <p className="text-xs text-white/30 mt-1">Affiché sur vos billets</p>
            </div>
          </div>
          <div>
            <label className={labelClass}>Email <span className="text-rose-neon">*</span></label>
            <input {...register('email')} type="email" placeholder="ton@email.com" className={inputClass} />
            {errors.email && <p className="text-rose-neon text-xs mt-1">{errors.email.message}</p>}
            <p className="text-xs text-white/30 mt-1">Pour recevoir vos confirmations d'achat</p>
          </div>
          <div>
            <label className={labelClass}>Numéro de téléphone <span className="text-white/30 font-normal normal-case">(optionnel)</span></label>
            <input {...register('phone')} type="tel" placeholder="+241 06X XXX XXX" className={inputClass} />
            {errors.phone && <p className="text-rose-neon text-xs mt-1">{errors.phone.message}</p>}
          </div>
          {role === 'ORGANIZER' && (
            <div>
              <label className={labelClass}>Nom de la société / Structure</label>
              <input {...register('companyName')} placeholder="Nom de votre structure" className={inputClass} />
            </div>
          )}
          <div>
            <label className={labelClass}>Mot de passe <span className="text-white/30 font-normal normal-case">(8 caractères minimum)</span></label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-rose-neon text-xs mt-1">{errors.password.message}</p>}
            <p className="text-xs text-white/30 mt-1">Minimum 8 caractères</p>
          </div>
          <div>
            <label className={labelClass}>Confirmer le mot de passe</label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-rose-neon text-xs mt-1">{errors.confirmPassword.message}</p>}
            <p className="text-xs text-white/30 mt-1">Doit être identique au mot de passe ci-dessus</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cguAccepted}
              onChange={(e) => setCguAccepted(e.target.checked)}
              className="mt-0.5 accent-violet-500 w-4 h-4 flex-shrink-0"
            />
            <span className="text-xs text-white/50 leading-relaxed">
              J'ai lu et j'accepte les{' '}
              <Link to="/cgu" target="_blank" className="text-violet-neon hover:underline">Conditions Générales d'Utilisation</Link>
              {' '}et la{' '}
              <Link to="/confidentialite" target="_blank" className="text-violet-neon hover:underline">Politique de confidentialité</Link>.
            </span>
          </label>

          {role === 'ORGANIZER' && (
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cgoAccepted}
                  onChange={(e) => setCgoAccepted(e.target.checked)}
                  className="mt-0.5 accent-violet-500 w-4 h-4 flex-shrink-0"
                />
                <span className="text-xs text-white/50 leading-relaxed">
                  J'ai lu, compris et j'accepte les{' '}
                  <Link to="/contrat-organisateur" target="_blank" className="text-violet-neon hover:underline font-semibold">
                    Conditions Générales Organisateur (CGO) — Version 2.0
                  </Link>
                  , incluant mes responsabilités en cas d'annulation d'événement et les modalités de versement.
                </span>
              </label>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={!cguAccepted || (role === 'ORGANIZER' && !cgoAccepted)}
            className="w-full mt-2"
          >
            Créer mon compte
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-violet-neon hover:text-rose-neon transition-colors">Se connecter</Link>
        </p>
      </motion.div>
    </div>
  );
}
