import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const ROLE_HOME: Record<string, string> = {
  BUYER: '/',
  ORGANIZER: '/dashboard',
  ADMIN: '/admin',
  SCANNER: '/scanner',
};

const ERROR_MESSAGES: Record<string, string> = {
  google_failed: 'La connexion avec Google a échoué. Veuillez réessayer.',
  google_no_email: 'Votre compte Google n\'a pas d\'adresse email associée.',
  account_disabled: 'Votre compte a été désactivé. Contactez le support.',
};

export default function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = searchParams.get('error');
    if (error) {
      toast.error(ERROR_MESSAGES[error] ?? 'Erreur de connexion Google.');
      navigate('/login', { replace: true });
      return;
    }

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      toast.error('Tokens manquants. Veuillez réessayer.');
      navigate('/login', { replace: true });
      return;
    }

    // Stocker les tokens et récupérer le profil
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(({ data }) => {
        const user = data.data;
        useAuthStore.setState({ user, accessToken, refreshToken, isAuthenticated: true });
        toast.success('Connexion avec Google réussie !');
        const redirectTarget = localStorage.getItem('auth_redirect');
        if (user.role === 'BUYER' && redirectTarget) {
          localStorage.removeItem('auth_redirect');
          navigate(decodeURIComponent(redirectTarget), { replace: true });
        } else {
          navigate(ROLE_HOME[user.role] ?? '/', { replace: true });
        }
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        toast.error('Impossible de récupérer votre profil. Veuillez réessayer.');
        navigate('/login', { replace: true });
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-neon/30 border-t-violet-neon rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Connexion en cours...</p>
      </div>
    </div>
  );
}
