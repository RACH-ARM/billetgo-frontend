import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowLeft, CheckCheck, ArrowUpRight } from 'lucide-react';
import { useNotifications, useMarkNotificationsRead, useMarkNotificationRead, type OrganizerNotification } from '../hooks/useOrganizer';
import { useAuthStore } from '../stores/authStore';
import { SkeletonCard } from '../components/common/Skeleton';
import { getNotificationTypeConfig, getNotificationLink } from '../utils/notificationTypes';

// ── Grouper par date ───────────────────────────────────────────
function groupByDate(notifs: OrganizerNotification[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; items: OrganizerNotification[] }[] = [
    { label: "Aujourd'hui", items: [] },
    { label: 'Hier', items: [] },
    { label: 'Cette semaine', items: [] },
    { label: 'Plus ancien', items: [] },
  ];

  for (const n of notifs) {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups[0].items.push(n);
    else if (d >= yesterday) groups[1].items.push(n);
    else if (d >= weekAgo) groups[2].items.push(n);
    else groups[3].items.push(n);
  }

  return groups.filter(g => g.items.length > 0);
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Carte notification ─────────────────────────────────────────
function NotifCard({ notif, index }: { notif: OrganizerNotification; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const markOne = useMarkNotificationRead();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const cfg = getNotificationTypeConfig(notif.type);
  const { Icon } = cfg;
  const link = getNotificationLink(notif, user?.role);

  const handleClick = () => {
    if (!notif.isRead) markOne.mutate(notif.id);
    if (link) navigate(link);
    else setExpanded(v => !v);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={handleClick}
      className={`
        relative glass-card p-4 border cursor-pointer transition-all duration-200
        ${notif.isRead
          ? 'border-white/5 hover:border-white/10 opacity-60 hover:opacity-80'
          : `${cfg.border} hover:border-opacity-50`
        }
      `}
    >
      {/* Indicateur non-lu */}
      {!notif.isRead && (
        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${cfg.color.replace('text-', 'bg-')} shadow-lg`} />
      )}

      <div className="flex items-start gap-3.5">
        {/* Icône */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-white/25">{formatTime(notif.createdAt)}</span>
            {link && <ArrowUpRight className="w-3 h-3 text-white/20 ml-auto flex-shrink-0" />}
          </div>
          <p className={`text-sm font-semibold mb-1 ${notif.isRead ? 'text-white/60' : 'text-white'}`}>
            {notif.title}
          </p>
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.p
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-white/50 leading-relaxed overflow-hidden"
              >
                {notif.message}
              </motion.p>
            ) : (
              <motion.p
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-white/40 line-clamp-2 leading-relaxed"
              >
                {notif.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page principale ────────────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: notifs, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const unreadCount = (notifs ?? []).filter(n => !n.isRead).length;
  const groups = groupByDate(notifs ?? []);

  const backPath = user?.role === 'ORGANIZER' ? '/dashboard' : '/mes-billets';

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(backPath)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-bebas text-2xl tracking-wider text-white leading-none">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-white/35 mt-0.5">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markRead.mutate()}
              disabled={markRead.isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-neon/20 text-violet-neon text-xs hover:bg-violet-neon/10 transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tout lire
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} lines={2} />)}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!notifs || notifs.length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-violet-neon/10 border border-violet-neon/20 flex items-center justify-center mb-6">
              <Bell className="w-9 h-9 text-violet-neon/50" />
            </div>
            <p className="font-bebas text-2xl tracking-wider text-white/30 mb-2">Aucune notification</p>
            <p className="text-sm text-white/20">Vous serez notifié ici des événements importants</p>
          </motion.div>
        )}

        {/* Groupes */}
        {!isLoading && groups.length > 0 && (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30">{group.label}</p>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="space-y-2.5">
                  {group.items.map((n, i) => (
                    <NotifCard key={n.id} notif={n} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
