import { X, Heart, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from './Button';

interface Props {
  onClose: () => void;
  action?: 'like' | 'follow';
}

export default function LoginWallModal({ onClose, action = 'like' }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
    onClose();
  };

  const handleRegister = () => {
    navigate('/register');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 max-w-sm w-full text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-rose-neon/10 flex items-center justify-center mx-auto mb-4">
          {action === 'like'
            ? <Heart className="w-6 h-6 text-rose-neon" />
            : <Users className="w-6 h-6 text-violet-neon" />
          }
        </div>

        <h3 className="font-bebas text-2xl tracking-wider text-white mb-2">
          {action === 'like' ? 'Ajouter aux favoris' : 'Suivre cet organisateur'}
        </h3>
        <p className="text-white/50 text-sm mb-6">
          Connecte-toi pour {action === 'like' ? 'liker cet événement' : 'suivre cet organisateur'} et ne rien manquer.
        </p>

        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={handleLogin} className="w-full">
            Se connecter
          </Button>
          <Button variant="secondary" onClick={handleRegister} className="w-full">
            Créer un compte
          </Button>
        </div>
      </div>
    </div>
  );
}
