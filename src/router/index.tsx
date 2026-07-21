import { createBrowserRouter, Navigate, Outlet, useRouteError } from 'react-router-dom';
import { useEffect } from 'react';
import {
  BuyerOrGuestRoute, OpenRoute, ProtectedRoute,
  Home, EventDetail, Checkout, MyTickets, OrganizerDashboard,
  AdminBackoffice, ScannerApp, Login, Register, OrganizerLanding,
  About, ContactPage, EventsPage, HowToUsePage, OrderConfirmation,
  CGU, CGV, Confidentialite, MentionsLegales, ForgotPassword,
  ResetPassword, VerifyEmail, OrganizerPublicPage, Notifications,
  OrganizerLayout, Versements, MesEvenements, MonCompte,
  ContratOrganisateur, GoogleAuthCallback, GuestTicketLookup,
  InfluencerDashboard, AcceptInvite,
} from './routes';

// Intercepte les erreurs de chunk Vite au niveau React Router
// (un chunk périmé après déploiement lève une TypeError avant que
//  vite:preloadError ne soit émis, ce qui affiche la page d'erreur par défaut)
function ChunkErrorBoundary() {
  const error = useRouteError();
  const isChunk =
    error instanceof TypeError &&
    (String((error as Error).message).includes('Failed to fetch dynamically imported module') ||
     String((error as Error).message).includes('Importing a module script failed') ||
     String((error as Error).message).includes('error loading dynamically imported module'));

  useEffect(() => {
    if (!isChunk) return;
    const last = sessionStorage.getItem('vite-chunk-reload');
    const now = Date.now();
    if (!last || now - parseInt(last) > 10_000) {
      sessionStorage.setItem('vite-chunk-reload', String(now));
      window.location.reload();
    }
  }, [isChunk]);

  if (isChunk) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#09060F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.45)',
        fontFamily: 'Sora, sans-serif', fontSize: 13, letterSpacing: '0.03em',
      }}>
        Mise à jour en cours…
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#09060F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(255,255,255,0.4)',
      fontFamily: 'Sora, sans-serif', fontSize: 14,
    }}>
      Une erreur inattendue s'est produite.
    </div>
  );
}

export const router = createBrowserRouter(
  [
    {
      // Route racine — errorElement couvre TOUTES les routes enfants
      element: <Outlet />,
      errorElement: <ChunkErrorBoundary />,
      children: [
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
            { path: 'contrat-organisateur', element: <ContratOrganisateur /> },
            { path: 'auth/google/success', element: <GoogleAuthCallback /> },
            { path: 'mot-de-passe-oublie', element: <ForgotPassword /> },
            { path: 'reset-password', element: <ResetPassword /> },
            { path: 'verify-email', element: <VerifyEmail /> },
            { path: 'checkout', element: <Checkout /> },
            { path: 'mes-billets', element: <MyTickets /> },
            { path: 'confirmation/:orderId', element: <OrderConfirmation /> },
            { path: 'retrouver-mes-billets', element: <GuestTicketLookup /> },
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
        {
          element: <ProtectedRoute roles={['INFLUENCER']} />,
          children: [{ path: 'influencer', element: <InfluencerDashboard /> }],
        },
        {
          element: <OpenRoute />,
          children: [{ path: 'influencer/accept-invite', element: <AcceptInvite /> }],
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);
