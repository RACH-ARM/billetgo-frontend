// @refresh reset
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Suspense, lazy } from 'react';

const Home = lazy(() => import('../pages/Home'));
const EventDetail = lazy(() => import('../pages/EventDetail'));
const Checkout = lazy(() => import('../pages/Checkout'));
const MyTickets = lazy(() => import('../pages/MyTickets'));
const OrganizerDashboard = lazy(() => import('../pages/OrganizerDashboard'));
const AdminBackoffice = lazy(() => import('../pages/AdminBackoffice'));
const ScannerApp = lazy(() => import('../pages/ScannerApp'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const OrganizerLanding = lazy(() => import('../pages/OrganizerLanding'));
const About = lazy(() => import('../pages/About'));
const ContactPage = lazy(() => import('../pages/Contact'));
const EventsPage = lazy(() => import('../pages/Events'));
const HowToUsePage = lazy(() => import('../pages/HowToUse'));
const OrderConfirmation = lazy(() => import('../pages/OrderConfirmation'));
const CGU = lazy(() => import('../pages/CGU'));
const CGV = lazy(() => import('../pages/CGV'));
const Confidentialite = lazy(() => import('../pages/Confidentialite'));
const MentionsLegales = lazy(() => import('../pages/MentionsLegales'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const VerifyEmail = lazy(() => import('../pages/VerifyEmail'));
const OrganizerPublicPage = lazy(() => import('../pages/OrganizerPublicPage'));
const Notifications = lazy(() => import('../pages/Notifications'));
const OrganizerLayout = lazy(() => import('../components/layout/OrganizerLayout'));
const Versements = lazy(() => import('../pages/Versements'));
const MesEvenements = lazy(() => import('../pages/MesEvenements'));
const MonCompte = lazy(() => import('../pages/MonCompte'));
const PublicLayout = lazy(() => import('../components/layout/PageLayout'));

const Spinner = () => (
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

// Redirige les utilisateurs non-BUYER vers leur interface (home/events = acheteurs uniquement)
const BuyerOrGuestRoute = () => {
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

// Accessible à tous les rôles (et non-authentifié) — pas de redirection
const OpenRoute = () => (
  <Suspense fallback={<Spinner />}>
    <PublicLayout />
  </Suspense>
);

const ProtectedRoute = ({ roles }: { roles?: string[] }) => {
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

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <BuyerOrGuestRoute />,
      children: [
        { index: true, element: <Home /> },
        { path: 'events/:id', element: <EventDetail /> },
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> },
      ],
    },
    {
      element: <OpenRoute />,
      children: [
        { path: 'organisateurs', element: <OrganizerLanding /> },
        { path: 'organisateurs/:id', element: <OrganizerPublicPage /> },
        { path: 'a-propos', element: <About /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'evenements', element: <EventsPage /> },
        { path: 'comment-ca-marche', element: <HowToUsePage /> },
        { path: 'cgu', element: <CGU /> },
        { path: 'cgv', element: <CGV /> },
        { path: 'confidentialite', element: <Confidentialite /> },
        { path: 'mentions-legales', element: <MentionsLegales /> },
        { path: 'mot-de-passe-oublie', element: <ForgotPassword /> },
        { path: 'reset-password', element: <ResetPassword /> },
        { path: 'verify-email', element: <VerifyEmail /> },
      ],
    },
    {
      element: <ProtectedRoute roles={['BUYER']} />,
      children: [
        { path: 'checkout', element: <Checkout /> },
        { path: 'mes-billets', element: <MyTickets /> },
        { path: 'confirmation/:orderId', element: <OrderConfirmation /> },
      ],
    },
    {
      element: <ProtectedRoute roles={['ORGANIZER']} />,
      children: [
        {
          element: <OrganizerLayout />,
          children: [
            { path: 'dashboard', element: <OrganizerDashboard /> },
            { path: 'mes-evenements', element: <MesEvenements /> },
            { path: 'versements', element: <Versements /> },
          ],
        },
      ],
    },
    {
      element: <ProtectedRoute roles={['BUYER', 'ORGANIZER']} />,
      children: [
        { path: 'notifications', element: <Notifications /> },
      ],
    },
    {
      element: <ProtectedRoute roles={['BUYER', 'ORGANIZER', 'SCANNER', 'ADMIN']} />,
      children: [
        { path: 'compte', element: <MonCompte /> },
      ],
    },
    {
      element: <ProtectedRoute roles={['ADMIN']} />,
      children: [{ path: 'admin', element: <AdminBackoffice /> }],
    },
    {
      element: <ProtectedRoute roles={['SCANNER']} />,
      children: [{ path: 'scanner', element: <ScannerApp /> }],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);
