import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ShoppingBag, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, AppNotification } from '../../hooks/useNotifications';
import { formatPrice } from '../../utils/formatPrice';

function NotifIcon({ type }: { type: string }) {
  if (type === 'NEW_SALE') return <ShoppingBag className="w-4 h-4 text-cyan-neon flex-shrink-0" />;
  return <Info className="w-4 h-4 text-violet-neon flex-shrink-0" />;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si click en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      // Marquer comme lues après ouverture du panneau (avec un léger délai)
      setTimeout(markAllRead, 1500);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-neon rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 glass-card border border-violet-neon/20 rounded-2xl overflow-hidden shadow-2xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-violet-neon hover:text-white transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Liste */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-white/30 text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((n: AppNotification, i: number) => (
                  <div
                    key={n.id ?? i}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 transition-colors ${
                      !n.isRead ? 'bg-violet-neon/5' : ''
                    }`}
                  >
                    <div className="mt-0.5">
                      <NotifIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-white leading-tight">{n.title}</p>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-neon flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{n.message}</p>
                      {n.type === 'NEW_SALE' && n.amount !== undefined && (
                        <p className="text-xs font-mono text-cyan-neon mt-0.5">
                          +{formatPrice(n.amount)}
                        </p>
                      )}
                      <p className="text-[10px] text-white/25 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
