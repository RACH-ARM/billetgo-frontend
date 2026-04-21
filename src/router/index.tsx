import { createBrowserRouter, Navigate } from 'react-router-dom';
import {
  BuyerOrGuestRoute, OpenRoute, ProtectedRoute,
  Home, EventDetail, Checkout, MyTickets, OrganizerDashboard,
  AdminBackoffice, ScannerApp, Login, Register, OrganizerLanding,
  About, ContactPage, EventsPage, HowToUsePage, OrderConfirmation,
  CGU, CGV, Confidentialite, MentionsLegales, ForgotPassword,
  ResetPassword, VerifyEmail, OrganizerPublicPage, Notifications,
  OrganizerLayout, Versements, MesEvenements, MonCompte,
  ContratOrganisateur, GoogleAuthCallback, Spinner,
} from './routes';

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
        { path: 'contrat-organisateur', element: <ContratOrganisateur /> },
        { path: 'auth/google/success', element: <GoogleAuthCallback /> },
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
