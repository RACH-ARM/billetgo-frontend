import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, Ticket } from 'lucide-react';

export default function GuestTicketLookup() {
  const backendBase = import.meta.env.VITE_BACKEND_URL ?? import.meta.env.VITE_API_URL ?? '';
  const googleUrl = `${backendBase}/api/v1/auth/google?origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-violet-neon/15 flex items-center justify-center flex-shrink-0">
            <Ticket className="w-5 h-5 text-violet-neon" />
          </div>
          <h1 className="font-bebas text-3xl tracking-wider text-gradient">RETROUVER MES BILLETS</h1>
        </div>

        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          Connectez-vous avec l'adresse email utilisée lors de votre achat. Si vous n'avez pas encore de compte, il sera créé automatiquement.
        </p>

        <button
          onClick={() => {
            localStorage.setItem('auth_redirect', '/mes-billets');
            window.location.href = googleUrl;
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-violet-neon/30 bg-white/5 hover:bg-white/10 text-white transition-colors font-semibold text-sm mb-4"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>

        <div className="relative flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/20 text-xs">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <Link
          to="/login"
          className="w-full flex items-center justify-center px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 text-sm transition-colors"
        >
          Se connecter par email
        </Link>

        <p className="mt-6 text-center text-xs text-white/25 leading-relaxed">
          Vous avez reçu un lien d'accès direct dans votre email après achat ?<br />
          Cliquez dessus — il vous amène directement à vos billets.
        </p>
      </motion.div>
    </div>
  );
}
