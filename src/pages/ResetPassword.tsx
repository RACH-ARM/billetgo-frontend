import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (password.length < 8) e.password = 'Minimum 8 caractères';
    if (password !== confirm) e.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      toast.error('Lien invalide. Refaites une demande de réinitialisation.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Mot de passe mis à jour !');
      navigate('/login');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Lien invalide ou expiré.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 w-full max-w-md text-center">
          <p className="text-rose-neon mb-4">Lien invalide ou expiré.</p>
          <Link to="/mot-de-passe-oublie" className="text-violet-neon hover:text-rose-neon transition-colors text-sm">
            Refaire une demande
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <Link to="/login" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="font-bebas text-4xl tracking-wider text-gradient mb-2">NOUVEAU MOT DE PASSE</h1>
        <p className="text-white/50 text-sm mb-8">Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-widest block mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-rose-neon text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-xs text-white/50 uppercase tracking-widest block mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
              />
            </div>
            {errors.confirm && <p className="text-rose-neon text-xs mt-1">{errors.confirm}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
            Enregistrer le mot de passe
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
