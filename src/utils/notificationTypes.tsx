import {
  CheckCircle, XCircle, CreditCard, AlertTriangle, Info,
  Ticket, CalendarDays, ShoppingBag,
} from 'lucide-react';

// Source de vérité unique pour l'apparence des notifications — partagée entre
// la cloche (en-tête) et la page /notifications pour qu'elles restent identiques.
export interface NotificationTypeConfig {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  label: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  EVENT_VALIDATED: {
    Icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20',
    label: 'Validation',
  },
  EVENT_REJECTED: {
    Icon: XCircle, color: 'text-rose-neon', bg: 'bg-rose-neon/10', border: 'border-rose-neon/20',
    label: 'Refus',
  },
  NEW_SALE: {
    Icon: ShoppingBag, color: 'text-cyan-neon', bg: 'bg-cyan-neon/10', border: 'border-cyan-neon/20',
    label: 'Vente',
  },
  PURCHASE_CONFIRMED: {
    Icon: Ticket, color: 'text-violet-neon', bg: 'bg-violet-neon/10', border: 'border-violet-neon/20',
    label: 'Commande',
  },
  SYSTEM: {
    Icon: Info, color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10',
    label: 'Information',
  },
  // Catégories pas encore émises par le backend à ce jour — gardées pour compatibilité.
  PAYMENT: {
    Icon: CreditCard, color: 'text-cyan-neon', bg: 'bg-cyan-neon/10', border: 'border-cyan-neon/20',
    label: 'Paiement',
  },
  TICKET_TRANSFERRED: {
    Icon: Ticket, color: 'text-violet-neon', bg: 'bg-violet-neon/10', border: 'border-violet-neon/20',
    label: 'Transfert',
  },
  REFUND: {
    Icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20',
    label: 'Remboursement',
  },
  EVENT_REMINDER: {
    Icon: CalendarDays, color: 'text-cyan-neon', bg: 'bg-cyan-neon/10', border: 'border-cyan-neon/20',
    label: 'Rappel',
  },
};

export const DEFAULT_NOTIFICATION_TYPE: NotificationTypeConfig = {
  Icon: Info, color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10',
  label: 'Notification',
};

export function getNotificationTypeConfig(type: string): NotificationTypeConfig {
  return NOTIFICATION_TYPE_CONFIG[type] ?? DEFAULT_NOTIFICATION_TYPE;
}

// Détermine où envoyer l'utilisateur au clic sur une notification, à partir de
// son type et des identifiants qu'elle transporte (data.eventId, data.orderId...).
// Retourne null si aucune destination pertinente n'existe (le clic ne fait alors
// que marquer la notification comme lue / la déplier).
export function getNotificationLink(
  notif: { type: string; data?: Record<string, unknown> | null; orderId?: string | null },
  role: string | undefined,
): string | null {
  const data = notif.data ?? {};

  if (notif.type === 'EVENT_VALIDATED' || notif.type === 'EVENT_REJECTED') {
    return role === 'ORGANIZER' ? '/mes-evenements' : null;
  }

  if (data.payoutId || data.payoutScheduleId || data.transactionRef) {
    return role === 'ORGANIZER' ? '/versements' : null;
  }

  if (notif.type === 'NEW_SALE') {
    return role === 'ORGANIZER' ? '/versements' : null;
  }

  if (notif.type === 'PURCHASE_CONFIRMED' || data.orderId || notif.orderId) {
    return role === 'BUYER' ? '/mes-billets' : null;
  }

  if (data.eventId) {
    return role === 'ORGANIZER' ? '/mes-evenements' : null;
  }

  return null;
}
