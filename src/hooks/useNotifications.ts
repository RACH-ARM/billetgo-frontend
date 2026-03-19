import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export interface AppNotification {
  id?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  // champs supplémentaires pour NEW_SALE
  amount?: number;
  eventTitle?: string;
  orderId?: string;
}

export function useNotifications() {
  const { isAuthenticated, user } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  // Charger l'historique initial depuis la DB
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    api.get('/notifications').then((r) => {
      const raw: (AppNotification & { data?: { netAmount?: number } })[] = r.data.data ?? [];
      const data: AppNotification[] = raw.map((n) => ({
        ...n,
        amount: n.type === 'NEW_SALE' ? (n.data?.netAmount ?? n.amount) : n.amount,
      }));
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    }).catch(() => {});
  }, [isAuthenticated]);

  // Connexion SSE
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';
    const url = `${baseUrl}/notifications/stream?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('connected', () => {
      // connexion confirmée — rien à faire
    });

    es.onmessage = (event) => {
      try {
        const notif: AppNotification = JSON.parse(event.data);
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);

        // Toast selon le type
        if (notif.type === 'NEW_SALE') {
          toast.success(`${notif.title} — ${notif.message}`, { duration: 6000, icon: '🎫' });
        } else {
          toast(notif.message, { duration: 5000 });
        }
      } catch {
        // message malformé — ignorer
      }
    };

    es.onerror = () => {
      // EventSource reconnecter automatiquement — pas d'action nécessaire
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silencieux
    }
  }, [unreadCount]);

  return { notifications, unreadCount, markAllRead };
}
