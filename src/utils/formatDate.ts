import { format, formatDistance, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatEventDate = (date: string | Date): string => {
  return format(new Date(date), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });
};

export const formatDateShort = (date: string | Date): string => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
};

export const formatTimeUntil = (date: string | Date): string => {
  const d = new Date(date);
  if (isPast(d)) return 'Terminé';
  return formatDistance(d, new Date(), { locale: fr, addSuffix: true });
};

export const formatReceiptDate = (date: string | Date): string => {
  return format(new Date(date), "d MMM yyyy 'à' HH'h'mm", { locale: fr });
};

export const getCountdownParts = (date: string | Date): { days: number; hours: number; minutes: number; seconds: number } | null => {
  const target = new Date(date).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};
