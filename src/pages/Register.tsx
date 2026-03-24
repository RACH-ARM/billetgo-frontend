import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { registerSchema, type RegisterFormData } from '../utils/validateForm';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

export default function Register() {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'organizer' ? 'ORGANIZER' : 'BUYER';
  const [role, setRole] = useState<'BUYER' | 'ORGANIZER'>(defaultRole);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'BUYER' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({ ...data, role, cguAcceptedAt: new Date().toISOString() });
      if (data.email) {
        toast.success('Compte créé ! Vérifiez votre email pour activer votre compte.', { duration: 5000 });
      } else {
        toast.success('Compte créé ! Bienvenue sur BilletGo.');
      }
      navigate(role === 'ORGANIZER' ? '/dashboard' : '/');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de l\'inscription';
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
        <p className="text-white/50 text-sm mb-6">Crée ton compte BilletGo en 30 secondes</p>

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Prénom</label>
              <input {...register('firstName')} placeholder="Jean" className={inputClass} />
              {errors.firstName && <p className="text-rose-neon text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Nom</label>
              <input {...register('lastName')} placeholder="Dupont" className={inputClass} />
              {errors.lastName && <p className="text-rose-neon text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>Email <span className="text-rose-neon">*</span></label>
            <input {...register('email')} type="email" placeholder="ton@email.com" className={inputClass} />
            {errors.email && <p className="text-rose-neon text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Numéro WhatsApp <span className="text-white/30 font-normal normal-case">(optionnel)</span></label>
            <input {...register('phone')} type="tel" placeholder="+241 62 55 76 55" className={inputClass} />
            {errors.phone ? (
              <p className="text-rose-neon text-xs mt-1">{errors.phone.message}</p>
            ) : (
              <p className="text-white/30 text-xs mt-1">Votre QR Code sera envoyé ici après achat</p>
            )}
          </div>
          {role === 'ORGANIZER' && (
            <div>
              <label className={labelClass}>Nom de la société / Structure</label>
              <input {...register('companyName')} placeholder="DISICK Events" className={inputClass} />
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

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={!cguAccepted} className="w-full mt-2">
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
