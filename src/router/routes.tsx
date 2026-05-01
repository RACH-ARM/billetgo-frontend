import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Suspense, lazy, ComponentType } from 'react';

// Quand Vite rebuild, les hashes de chunks changent. Si le navigateur essaie
// de charger un ancien hash (chunk introuvable), on recharge la page une fois
// pour récupérer les nouveaux chunks plutôt que de crasher.
function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch(() => {
      const key = 'vite-chunk-reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
      return new Promise<{ default: T }>(() => {});
    })
  );
}

export const Home = lazyWithReload(() => import('../pages/Home'));
export const EventDetail = lazyWithReload(() => import('../pages/EventDetail'));
export const Checkout = lazyWithReload(() => import('../pages/Checkout'));
export const MyTickets = lazyWithReload(() => import('../pages/MyTickets'));
export const OrganizerDashboard = lazyWithReload(() => import('../pages/OrganizerDashboard'));
export const AdminBackoffice = lazyWithReload(() => import('../pages/AdminBackoffice'));
export const ScannerApp = lazyWithReload(() => import('../pages/ScannerApp'));
export const Login = lazyWithReload(() => import('../pages/Login'));
export const Register = lazyWithReload(() => import('../pages/Register'));
export const OrganizerLanding = lazyWithReload(() => import('../pages/OrganizerLanding'));
export const About = lazyWithReload(() => import('../pages/About'));
export const ContactPage = lazyWithReload(() => import('../pages/Contact'));
export const EventsPage = lazyWithReload(() => import('../pages/Events'));
export const HowToUsePage = lazyWithReload(() => import('../pages/HowToUse'));
export const OrderConfirmation = lazyWithReload(() => import('../pages/OrderConfirmation'));
export const CGU = lazyWithReload(() => import('../pages/CGU'));
export const CGV = lazyWithReload(() => import('../pages/CGV'));
export const Confidentialite = lazyWithReload(() => import('../pages/Confidentialite'));
export const MentionsLegales = lazyWithReload(() => import('../pages/MentionsLegales'));
export const ForgotPassword = lazyWithReload(() => import('../pages/ForgotPassword'));
export const ResetPassword = lazyWithReload(() => import('../pages/ResetPassword'));
export const VerifyEmail = lazyWithReload(() => import('../pages/VerifyEmail'));
export const OrganizerPublicPage = lazyWithReload(() => import('../pages/OrganizerPublicPage'));
export const Notifications = lazyWithReload(() => import('../pages/Notifications'));
export const OrganizerLayout = lazyWithReload(() => import('../components/layout/OrganizerLayout'));
export const Versements = lazyWithReload(() => import('../pages/Versements'));
export const MesEvenements = lazy(() => import('../pages/MesEvenements'));
export const MonCompte = lazy(() => import('../pages/MonCompte'));
export const ContratOrganisateur = lazy(() => import('../pages/ContratOrganisateur'));
export const GoogleAuthCallback = lazy(() => import('../pages/GoogleAuthCallback'));
export const PublicLayout = lazy(() => import('../components/layout/PageLayout'));

export const Spinner = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-violet-neon/30 border-t-violet-neon rounded-full animate-spin" />
  </div>
);

const ROLE_HOME: Record<string, string> = {
  BUYER: '/',
  ORGANIZER: '/dashboard',
  ADMIN: '/admin',
  SCANNER: '/scanner',
};

export const BuyerOrGuestRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user && user.role !== 'BUYER') {
    return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
  }
  return (
    <Suspense fallback={<Spinner />}>
      <PublicLayout />
    </Suspense>
  );
};

export const OpenRoute = () => (
  <Suspense fallback={<Spinner />}>
    <PublicLayout />
  </Suspense>
);

export const ProtectedRoute = ({ roles }: { roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
  }
  return (
    <Suspense fallback={<Spinner />}>
      <Outlet />
    </Suspense>
  );
};
