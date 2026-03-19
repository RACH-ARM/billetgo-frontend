import api from './api';

export interface OrganizerEventStat {
  eventId: string;
  title: string;
  status: string;
  eventDate: string;
  scheduledPublishAt: string | null;
  rejectionReason: string | null;
  adminNote: string | null;
  offer: 'STANDARD' | 'INTERMEDIAIRE' | 'PREMIUM';
  commissionRate: number;
  totalSold: number;
  totalTickets: number;
  totalRevenue: number;
  occupancyRate: number;
}

export interface OrganizerStats {
  events: OrganizerEventStat[];
  globalRevenue: number;
  globalSold: number;
  eventsCount: number;
}

export interface BuyerOrder {
  id: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerPhone: string;
  totalAmount: number;
  createdAt: string;
  orderItems: { category: { name: string }; quantity: number; unitPrice: number }[];
  payments: { provider: string; completedAt: string | null }[];
}

export interface ScannerEntry {
  id: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; phone: string | null; isActive: boolean };
  event: { id: string; title: string; eventDate: string };
}

export interface CreateEventTicketCategory {
  name: string;
  description?: string;
  price: number;
  quantityTotal: number;
  maxPerOrder?: number;
}

export interface CreateEventPayload {
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  eventDate: string;
  doorsOpenAt?: string;
  endDate?: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  maxTicketsPerOrder?: number;
  ticketCategories: CreateEventTicketCategory[];
  contractAcceptedAt?: string;
  scheduledPublishAt?: string;
}

export interface CreateScannerPayload {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  eventId: string;
}

export interface OrganizerProfile {
  companyName: string;
  description: string | null;
  logoUrl: string | null;
  mobileMoneyNumber: string | null;
  isApproved: boolean;
  rejectionReason: string | null;
}

export interface OrganizerPayout {
  id: string;
  amountSent: number;
  mobileMoney: string;
  operator: string;
  transactionRef: string | null;
  processedAt: string;
}

export interface OrganizerPayoutSummary {
  totalCollected: number;
  totalPlatformFee: number;
  totalNetAmount: number;
  totalPaid: number;
  balanceDue: number;
  payouts: OrganizerPayout[];
}

export const organizerService = {
  getProfile: async (): Promise<OrganizerProfile> => {
    const { data } = await api.get('/organizer/profile');
    return data.data;
  },

  updateProfile: async (payload: { mobileMoneyNumber: string }): Promise<OrganizerProfile> => {
    const { data } = await api.patch('/organizer/profile', payload);
    return data.data;
  },

  getStats: async (): Promise<OrganizerStats> => {
    const { data } = await api.get('/organizer/stats');
    return data.data;
  },

  getEventBuyers: async (eventId: string): Promise<BuyerOrder[]> => {
    const { data } = await api.get(`/organizer/events/${eventId}/buyers`);
    return data.data;
  },

  exportCSV: (eventId: string) => {
    const token = localStorage.getItem('accessToken');
    const url = `${api.defaults.baseURL}/organizer/events/${eventId}/buyers/export`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.click();
        URL.revokeObjectURL(objUrl);
      });
  },

  getScanners: async (): Promise<ScannerEntry[]> => {
    const { data } = await api.get('/organizer/scanners');
    return data.data;
  },

  createScannerAccount: async (payload: CreateScannerPayload) => {
    const { data } = await api.post('/organizer/scanners/create-account', payload);
    return data.data;
  },

  updateEventCover: async (eventId: string, coverImage: File) => {
    const formData = new FormData();
    formData.append('coverImage', coverImage);
    // Content-Type: undefined — laisse le navigateur définir multipart/form-data + boundary
    const { data } = await api.patch(`/organizer/events/${eventId}/cover`, formData, {
      headers: { 'Content-Type': undefined },
    });
    return data.data;
  },

  getEventWaitlist: async (eventId: string) => {
    const { data } = await api.get(`/organizer/events/${eventId}/waitlist`);
    return data.data as { waitlist: { id: string; email: string; phone: string | null; notified: boolean; createdAt: string }[]; total: number };
  },

  exportWaitlistCSV: (eventId: string) => {
    const token = localStorage.getItem('accessToken');
    const url = `${api.defaults.baseURL}/organizer/events/${eventId}/waitlist/export`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = `waitlist-${eventId}.csv`;
        a.click();
        URL.revokeObjectURL(objUrl);
      });
  },

  getMyPayouts: async (): Promise<OrganizerPayoutSummary> => {
    const { data } = await api.get('/organizer/payouts');
    return data.data;
  },

  updateEvent: async (eventId: string, payload: Partial<CreateEventPayload>, coverImage?: File) => {
    const formData = new FormData();
    (Object.keys(payload) as (keyof CreateEventPayload)[]).forEach((key) => {
      if (key === 'ticketCategories') return;
      const val = payload[key];
      if (val !== undefined && val !== '') formData.append(key, String(val));
    });
    if (payload.ticketCategories) {
      formData.append('ticketCategories', JSON.stringify(payload.ticketCategories));
    }
    if (coverImage) formData.append('coverImage', coverImage);
    const { data } = await api.patch(`/organizer/events/${eventId}`, formData, {
      headers: { 'Content-Type': undefined },
    });
    return data.data;
  },

  createEvent: async (payload: CreateEventPayload, coverImage?: File) => {
    const formData = new FormData();
    // Champs scalaires
    (Object.keys(payload) as (keyof CreateEventPayload)[]).forEach((key) => {
      if (key === 'ticketCategories') return;
      const val = payload[key];
      if (val !== undefined && val !== '') formData.append(key, String(val));
    });
    // Catégories en JSON string
    formData.append('ticketCategories', JSON.stringify(payload.ticketCategories));
    // Image optionnelle
    if (coverImage) formData.append('coverImage', coverImage);

    // Content-Type: undefined — laisse le navigateur définir multipart/form-data + boundary
    const { data } = await api.post('/organizer/events', formData, {
      headers: { 'Content-Type': undefined },
    });
    return data.data;
  },
};
