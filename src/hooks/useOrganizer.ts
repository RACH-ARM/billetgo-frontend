import { useQuery, useMutation, useQueryClient } from 'react-query';
import { organizerService, type CreateScannerPayload, type CreateEventPayload } from '../services/organizerService';
import api from '../services/api';

export interface PlatformRates {
  standardCommission: number;
  intermediateCommission: number;
  premiumCommission: number;
  freeTicketFee: number;
}

const FALLBACK_RATES: PlatformRates = {
  standardCommission: 0.10,
  intermediateCommission: 0.10,
  premiumCommission: 0.10,
  freeTicketFee: 500,
};

export const usePlatformRates = () =>
  useQuery<PlatformRates>(
    'platform-rates',
    () => api.get('/events/platform-config').then((r) => r.data.data),
    { staleTime: 5 * 60_000, placeholderData: FALLBACK_RATES }
  );

export const useOrganizerProfile = () =>
  useQuery('organizer-profile', organizerService.getProfile, { staleTime: 60_000 });

export const useUploadKYC = () => {
  const qc = useQueryClient();
  return useMutation(
    (file: File) => {
      const form = new FormData();
      form.append('kycDocument', file);
      return api.post('/organizer/kyc', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    { onSuccess: () => qc.invalidateQueries('organizer-profile') }
  );
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation(
    (payload: { mobileMoneyNumber: string }) => organizerService.updateProfile(payload),
    { onSuccess: () => qc.invalidateQueries('organizer-profile') }
  );
};

export const useOrganizerStats = () =>
  useQuery('organizer-stats', organizerService.getStats, { staleTime: 30_000 });

export const useOrganizerPayouts = () =>
  useQuery('organizer-payouts', organizerService.getMyPayouts, { staleTime: 30_000 });

export const useOrganizerPayoutSchedules = () =>
  useQuery('organizer-payout-schedules', organizerService.getMyPayoutSchedules, { staleTime: 30_000 });

export const useEventBuyers = (eventId: string | null) =>
  useQuery(
    ['organizer-buyers', eventId],
    () => organizerService.getEventBuyers(eventId!),
    { enabled: !!eventId }
  );

export const useMyScanners = () =>
  useQuery('organizer-scanners', organizerService.getScanners, { staleTime: 60_000 });

export const useCreateScannerAccount = () => {
  const qc = useQueryClient();
  return useMutation(
    (payload: CreateScannerPayload) => organizerService.createScannerAccount(payload),
    { onSuccess: () => qc.invalidateQueries('organizer-scanners') }
  );
};

export const useUpdateEventCover = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ eventId, coverImage }: { eventId: string; coverImage: File }) =>
      organizerService.updateEventCover(eventId, coverImage),
    { onSuccess: () => qc.invalidateQueries('organizer-stats') }
  );
};

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ payload, coverImage }: { payload: CreateEventPayload; coverImage?: File }) =>
      organizerService.createEvent(payload, coverImage),
    { onSuccess: () => qc.invalidateQueries('organizer-stats') }
  );
};

export const useEventDetails = (eventId: string | null) =>
  useQuery(
    ['organizer-event', eventId],
    () => api.get(`/organizer/events/${eventId}`).then(r => r.data.data),
    { enabled: !!eventId, staleTime: 0 }
  );

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ eventId, payload, coverImage }: { eventId: string; payload: Partial<CreateEventPayload>; coverImage?: File }) =>
      organizerService.updateEvent(eventId, payload, coverImage),
    { onSuccess: () => qc.invalidateQueries('organizer-stats') }
  );
};

export const useProposeChanges = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ eventId, payload, coverImage }: { eventId: string; payload: Partial<CreateEventPayload>; coverImage?: File }) => {
      const form = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          form.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
        }
      });
      if (coverImage) form.append('coverImage', coverImage);
      return api.patch(`/organizer/events/${eventId}/propose`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data);
    },
    { onSuccess: () => qc.invalidateQueries('organizer-stats') }
  );
};

export const useResubmitEvent = () => {
  const qc = useQueryClient();
  return useMutation(
    (eventId: string) => api.patch(`/organizer/events/${eventId}/resubmit`).then(r => r.data),
    { onSuccess: () => qc.invalidateQueries('organizer-stats') }
  );
};

export const useCloneEvent = () => {
  const qc = useQueryClient();
  return useMutation(
    (eventId: string) => api.post(`/organizer/events/${eventId}/clone`).then(r => r.data),
    { onSuccess: () => qc.invalidateQueries('organizer-stats') }
  );
};

export const useCancelEvent = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ eventId, reason }: { eventId: string; reason?: string }) =>
      api.patch(`/organizer/events/${eventId}/cancel`, { reason }).then(r => r.data),
    { onSuccess: () => qc.invalidateQueries('organizer-stats') }
  );
};

export const useOrganizerAnalytics = (days: number, eventId?: string) =>
  useQuery(
    ['organizer-analytics', days, eventId],
    () => {
      const params = new URLSearchParams({ days: String(days) });
      if (eventId) params.set('eventId', eventId);
      return api.get(`/organizer/analytics?${params.toString()}`).then(r => r.data.data);
    },
    { staleTime: 60_000, keepPreviousData: true }
  );

export const useEventWaitlist = (eventId: string | null) =>
  useQuery(
    ['organizer-waitlist', eventId],
    () => organizerService.getEventWaitlist(eventId!),
    { enabled: !!eventId, staleTime: 30_000 }
  );

export const useEventPromos = (eventId: string | null) =>
  useQuery(
    ['organizer-promos', eventId],
    () => api.get(`/organizer/events/${eventId}/promos`).then(r => r.data.data),
    { enabled: !!eventId, staleTime: 30_000 }
  );

export const useCreatePromoCode = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation(
    (payload: { code: string; discountType: string; discountValue: number; maxUses?: number; expiresAt?: string }) =>
      api.post(`/organizer/events/${eventId}/promos`, payload).then(r => r.data),
    { onSuccess: () => qc.invalidateQueries(['organizer-promos', eventId]) }
  );
};

export const useDeletePromoCode = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation(
    (promoId: string) => api.delete(`/organizer/events/${eventId}/promos/${promoId}`).then(r => r.data),
    { onSuccess: () => qc.invalidateQueries(['organizer-promos', eventId]) }
  );
};

export interface OrganizerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export const useNotifications = () =>
  useQuery<OrganizerNotification[]>(
    'organizer-notifications',
    () => api.get('/notifications').then(r => r.data.data),
    { staleTime: 30_000 }
  );

export const useMarkNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation(
    () => api.patch('/notifications/read-all').then(r => r.data),
    { onSuccess: () => qc.invalidateQueries('organizer-notifications') }
  );
};

export const useUploadEventGallery = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ eventId, photos }: { eventId: string; photos: File[] }) =>
      organizerService.uploadEventGallery(eventId, photos),
    {
      onSuccess: (data, { eventId }) => {
        qc.setQueryData(['organizer-event', eventId], (prev: Record<string, unknown> | undefined) =>
          prev ? { ...prev, galleryUrls: data.galleryUrls } : prev
        );
      },
    }
  );
};

export const useDeleteEventGalleryPhoto = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ eventId, url }: { eventId: string; url: string }) =>
      organizerService.deleteEventGalleryPhoto(eventId, url),
    {
      onSuccess: (data, { eventId }) => {
        qc.setQueryData(['organizer-event', eventId], (prev: Record<string, unknown> | undefined) =>
          prev ? { ...prev, galleryUrls: data.galleryUrls } : prev
        );
      },
    }
  );
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation(
    (id: string) => api.patch(`/notifications/${id}`).then(r => r.data),
    {
      onSuccess: (_data, id) => {
        qc.setQueryData<OrganizerNotification[]>('organizer-notifications', (prev) =>
          prev ? prev.map(n => n.id === id ? { ...n, isRead: true } : n) : prev
        );
      },
    }
  );
};
