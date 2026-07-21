import api from './api';
import type { PromoCode, PromoValidation, InfluencerDashboardData } from '../types/promo';

export const promoService = {
  // Valider un code promo avant de créer la commande
  validate: async (code: string, eventId: string, rawTotal: number): Promise<PromoValidation> => {
    const { data } = await api.post('/promo/validate', { code, eventId, rawTotal });
    return data.data;
  },

  // Organizer — lister les codes d'un événement
  getCodes: async (eventId: string): Promise<PromoCode[]> => {
    const { data } = await api.get(`/promo/events/${eventId}/promo-codes`);
    return data.data;
  },

  // Organizer — créer un code
  createCode: async (eventId: string, payload: {
    influencerEmail: string;
    influencerFirstName?: string;
    influencerLastName?: string;
    code: string;
    label?: string;
    discountType: string;
    discountValue: number;
    commissionType: string;
    commissionValue: number;
  }): Promise<PromoCode> => {
    const { data } = await api.post(`/promo/events/${eventId}/promo-codes`, payload);
    return data.data;
  },

  // Organizer — activer / désactiver
  toggleCode: async (eventId: string, codeId: string): Promise<PromoCode> => {
    const { data } = await api.patch(`/promo/events/${eventId}/promo-codes/${codeId}`);
    return data.data;
  },

  // Organizer — supprimer
  deleteCode: async (eventId: string, codeId: string): Promise<void> => {
    await api.delete(`/promo/events/${eventId}/promo-codes/${codeId}`);
  },

  // Influenceur — dashboard
  getDashboard: async (): Promise<InfluencerDashboardData> => {
    const { data } = await api.get('/influencer/dashboard');
    return data.data;
  },

  // Influenceur — demander un versement
  requestPayout: async (phoneNumber: string, operator: 'AIRTEL_MONEY' | 'MOOV_MONEY'): Promise<void> => {
    await api.post('/influencer/payouts', { phoneNumber, operator });
  },

  // Tracker un clic sur lien influenceur (silencieux)
  trackClick: async (eventId: string, code: string): Promise<void> => {
    await api.post('/promo/track-click', { eventId, code }).catch(() => {});
  },
};
