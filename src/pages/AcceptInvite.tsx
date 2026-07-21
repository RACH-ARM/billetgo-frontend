import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { loginWithTokens } = useAuthStore();

  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (form.password.length < 8) { setError('Minimum 8 caractères.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/accept-invite', {
        token,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      loginWithTokens(data.data.user, data.data.accessToken, data.data.refreshToken);
      navigate('/influencer', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Lien invalide ou expiré. Contactez l\'organisateur.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full p-10 text-center">
          <p className="text-rose-neon font-semibold">Lien d'invitation invalide.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="glass-card max-w-md w-full p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-bebas text-3xl tracking-wider text-gradient">ACTIVER MON COMPTE</h1>
          <p className="text-white/50 text-sm mt-2">Créez votre mot de passe pour accéder à votre espace influenceur.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">Prénom</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Prénom"
                className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">Nom</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Nom"
                className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">Mot de passe <span className="text-rose-neon">*</span></label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Minimum 8 caractères"
                className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">Confirmer <span className="text-rose-neon">*</span></label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Répétez le mot de passe"
              className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
            />
          </div>

          {error && <p className="text-rose-neon text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !form.password || !form.confirm}
            className="neon-button w-full py-3.5 font-semibold rounded-xl disabled:opacity-40"
          >
            {loading ? 'Activation...' : 'Activer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
