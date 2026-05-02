import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Suspense } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CookieBanner from '../common/CookieBanner';
import { useAuthStore } from '../../stores/authStore';
import SplashLoader from '../common/SplashLoader';

const PageSpinner = () => <SplashLoader inline />;

export default function PageLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const hasVerifBanner = isAuthenticated && !!user?.email && !user?.isVerified && user?.role !== 'ORGANIZER';

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollRestoration />
      <Navbar />
      <main className={`flex-1 ${hasVerifBanner ? 'pt-[100px]' : 'pt-16'}`}>
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
