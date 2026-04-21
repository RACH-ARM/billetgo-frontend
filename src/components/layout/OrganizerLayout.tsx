import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Banknote, CalendarDays, Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotifications, useOrganizerProfile } from '../../hooks/useOrganizer';

const APPROVAL_REQUIRED_PATHS = ['/mes-evenements', '/versements'];

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/mes-evenements', icon: CalendarDays, label: 'Mes événements' },
  { to: '/versements', icon: Banknote, label: 'Mes versements' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
    isActive
      ? 'bg-violet-neon/15 text-white border-l-2 border-violet-neon'
      : 'text-white/40 hover:text-white hover:bg-white/5'
  }`;

function NavItems({ onClose }: { onClose: () => void }) {
  const { data: notifs } = useNotifications();
  const unreadCount = (notifs ?? []).filter((n) => !n.isRead).length;

  return (
    <>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}

      <NavLink to="/notifications" className={linkClass} onClick={onClose}>
        <div className="relative flex-shrink-0">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-rose-neon text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-rose-neon/20 text-rose-neon text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </NavLink>
    </>
  );
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-white/5 flex-shrink-0 flex justify-center pl-12">
        <Link to="/dashboard" onClick={onClose}>
          <img src="/logo.svg" alt="BilletGo" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="px-5 py-4 border-b border-white/5 flex-shrink-0">
        <p className="text-sm font-semibold text-white leading-tight">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-xs text-violet-neon mt-0.5">Organisateur</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItems onClose={onClose} />

        <div className="my-3 border-t border-white/5" />

        <NavLink
          to="/compte"
          className={linkClass}
          onClick={onClose}
        >
          <User className="w-4 h-4 flex-shrink-0" />
          <span>Mon compte</span>
        </NavLink>
      </nav>

      <div className="px-3 py-4 border-t border-white/5 flex-shrink-0">
        <button
          onClick={() => { logout(); }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-rose-neon hover:bg-rose-neon/5 transition-all w-full"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

export default function OrganizerLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: notifs } = useNotifications();
  const unreadCount = (notifs ?? []).filter((n) => !n.isRead).length;
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUser, user } = useAuthStore();
  const { data: profile } = useOrganizerProfile();

  // Sync isApproved depuis le profil — quand l'admin approuve, plus besoin de re-login
  useEffect(() => {
    if (profile?.isApproved !== undefined && profile.isApproved !== user?.isApproved) {
      updateUser({ isApproved: profile.isApproved });
    }
  }, [profile?.isApproved]);

  // Garde : on attend que le profil soit chargé, puis on redirige si non approuvé
  useEffect(() => {
    if (profile === undefined) return;
    const onProtectedPath = APPROVAL_REQUIRED_PATHS.some(p => location.pathname.startsWith(p));
    if (onProtectedPath && !profile.isApproved) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, location.pathname]);

  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    closeDrawer();
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-[#0D0D1A]">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0D0D1A] border-r border-white/5 z-30">
        <SidebarContent onClose={closeDrawer} />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-[#0D0D1A]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard">
          <img src="/logo.svg" alt="BilletGo" className="h-7 w-auto" />
        </Link>

        <Link
          to="/notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-neon text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* ── Mobile backdrop ── */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* ── Mobile drawer — always in DOM, translated in/out ── */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#0D0D1A] border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={closeDrawer}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all z-10"
          aria-label="Fermer le menu"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent onClose={closeDrawer} />
      </div>

      {/* ── Main content ── */}
      <main className="lg:pl-60 pt-16 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
