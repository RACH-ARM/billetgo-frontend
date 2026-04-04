import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Suspense } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CookieBanner from '../common/CookieBanner';
import { useAuthStore } from '../../stores/authStore';

const PageSpinner = () => (
  <div className="flex justify-center items-center py-40">
    <div className="w-10 h-10 border-4 border-violet-neon/30 border-t-violet-neon rounded-full animate-spin" />
  </div>
);

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
