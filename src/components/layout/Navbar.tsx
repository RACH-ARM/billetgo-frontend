import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Ticket, LayoutDashboard, ShieldCheck, ScanLine, LogOut, Menu, X, MailWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import NotificationBell from './NotificationBell';

const ROLE_CONFIG = {
  BUYER:     { label: 'Mes billets',   Icon: Ticket,          path: '/mes-billets' },
  ORGANIZER: { label: 'Mon dashboard', Icon: LayoutDashboard, path: '/dashboard' },
  ADMIN:     { label: 'Back-office',   Icon: ShieldCheck,     path: '/admin' },
  SCANNER:   { label: 'Scanner',       Icon: ScanLine,        path: '/scanner' },
};

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = getTotalItems();
  const roleConfig = user?.role ? ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] : null;

  const close = () => setMenuOpen(false);

  const handleLogout = async () => {
    close();
    await logout();
    toast.success('Déconnexion réussie');
    navigate('/');
  };

  const [resendLoading, setResendLoading] = useState(false);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success('Email de vérification renvoyé');
    } catch {
      toast.error('Erreur, réessayez plus tard');
    } finally {
      setResendLoading(false);
    }
  };

  const showVerifBanner = isAuthenticated && user?.email && !user?.isVerified;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-violet-neon/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" onClick={close} className="font-bebas text-2xl tracking-widest text-gradient flex-shrink-0">
          BILLETGO
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">

          {cartCount > 0 && (
            <Link to="/checkout" className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-neon/10 border border-violet-neon/30 hover:border-violet-neon/60 transition-colors text-violet-neon text-sm font-semibold">
              <ShoppingCart className="w-4 h-4" />
              <span>Panier</span>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-neon rounded-full text-white text-xs font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </Link>
          )}

          {isAuthenticated && roleConfig ? (
            <>
              {user?.role === 'BUYER' && (
                <>
                  <Link to="/" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">Accueil</Link>
                  <Link to="/evenements" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">Événements</Link>
                  <Link to="/a-propos" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">À propos</Link>
                  <Link to="/contact" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">Contact</Link>
                </>
              )}
              <NotificationBell />
              <Link to={roleConfig.path} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all">
                <roleConfig.Icon className="w-4 h-4" />
                {roleConfig.label}
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-white/40 hover:text-rose-neon hover:bg-rose-neon/5 transition-all" title="Déconnexion">
                <LogOut className="w-4 h-4" />
                Déco
              </button>
            </>
          ) : !isAuthenticated ? (
            <>
              <Link to="/" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">Accueil</Link>
              <Link to="/evenements" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">Événements</Link>
              <Link to="/organisateurs" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">Organisateurs</Link>
              <Link to="/a-propos" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">À propos</Link>
              <Link to="/contact" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">Contact</Link>
              <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1">Connexion</Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register?role=organizer" className="neon-button text-sm py-2 px-4">Publier un Event</Link>
              </motion.div>
            </>
          ) : null}
        </div>

        {/* Mobile — panier + cloche + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {cartCount > 0 && (
            <Link to="/checkout" className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-neon/10 border border-violet-neon/30 text-violet-neon text-sm font-semibold">
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-neon rounded-full text-white text-xs font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </Link>
          )}
          {isAuthenticated && <NotificationBell />}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Bandeau vérification email */}
      {showVerifBanner && (
        <div className="bg-yellow-400/10 border-b border-yellow-400/20 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-yellow-400 text-xs">
            <MailWarning className="w-4 h-4 flex-shrink-0" />
            <span>Vérifiez votre email <strong>{user?.email}</strong> pour activer votre compte.</span>
          </div>
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold whitespace-nowrap transition-colors disabled:opacity-50"
          >
            {resendLoading ? 'Envoi...' : 'Renvoyer'}
          </button>
        </div>
      )}

      {/* Mobile menu déroulant */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="sm:hidden bg-bg/95 backdrop-blur-md border-b border-violet-neon/20 px-4 py-4 flex flex-col gap-1"
          >
            {isAuthenticated && roleConfig ? (
              <>
                {user?.role === 'BUYER' && (
                  <>
                    <Link to="/" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">Accueil</Link>
                    <Link to="/evenements" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">Événements</Link>
                    <Link to="/a-propos" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">À propos</Link>
                    <Link to="/contact" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">Contact</Link>
                  </>
                )}
                <Link to={roleConfig.path} onClick={close} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all">
                  <roleConfig.Icon className="w-4 h-4" />
                  {roleConfig.label}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-rose-neon hover:bg-rose-neon/5 transition-all text-left">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">Accueil</Link>
                <Link to="/evenements" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">Événements</Link>
                <Link to="/organisateurs" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">Organisateurs</Link>
                <Link to="/a-propos" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">À propos</Link>
                <Link to="/contact" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">Contact</Link>
                <div className="border-t border-white/5 mt-1 pt-2 flex flex-col gap-1">
                  <Link to="/login" onClick={close} className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">Connexion</Link>
                  <Link to="/register?role=organizer" onClick={close} className="neon-button text-sm py-2.5 px-4 text-center mt-1">Publier un Event</Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
