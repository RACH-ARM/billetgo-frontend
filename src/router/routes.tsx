import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Suspense, lazy } from 'react';

export const Home = lazy(() => import('../pages/Home'));
export const EventDetail = lazy(() => import('../pages/EventDetail'));
export const Checkout = lazy(() => import('../pages/Checkout'));
export const MyTickets = lazy(() => import('../pages/MyTickets'));
export const OrganizerDashboard = lazy(() => import('../pages/OrganizerDashboard'));
export const AdminBackoffice = lazy(() => import('../pages/AdminBackoffice'));
export const ScannerApp = lazy(() => import('../pages/ScannerApp'));
export const Login = lazy(() => import('../pages/Login'));
export const Register = lazy(() => import('../pages/Register'));
export const OrganizerLanding = lazy(() => import('../pages/OrganizerLanding'));
export const About = lazy(() => import('../pages/About'));
export const ContactPage = lazy(() => import('../pages/Contact'));
export const EventsPage = lazy(() => import('../pages/Events'));
export const HowToUsePage = lazy(() => import('../pages/HowToUse'));
export const OrderConfirmation = lazy(() => import('../pages/OrderConfirmation'));
export const CGU = lazy(() => import('../pages/CGU'));
export const CGV = lazy(() => import('../pages/CGV'));
export const Confidentialite = lazy(() => import('../pages/Confidentialite'));
export const MentionsLegales = lazy(() => import('../pages/MentionsLegales'));
export const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
export const ResetPassword = lazy(() => import('../pages/ResetPassword'));
export const VerifyEmail = lazy(() => import('../pages/VerifyEmail'));
export const OrganizerPublicPage = lazy(() => import('../pages/OrganizerPublicPage'));
export const Notifications = lazy(() => import('../pages/Notifications'));
export const OrganizerLayout = lazy(() => import('../components/layout/OrganizerLayout'));
export const Versements = lazy(() => import('../pages/Versements'));
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
