import api from './api';
import type { Ticket } from '../types/ticket';

export const ticketService = {
  getMyTickets: async (): Promise<Ticket[]> => {
    const { data } = await api.get('/tickets');
    return data.data;
  },

  getTicketQRUrl: (ticketId: string): string => {
    const token = localStorage.getItem('accessToken');
    return `${import.meta.env.VITE_API_URL || '/api/v1'}/tickets/${ticketId}/qr?token=${token}`;
  },

  downloadTicketPDF: (ticketId: string): void => {
    const token = localStorage.getItem('accessToken') ?? '';
    const base  = import.meta.env.VITE_API_URL || '/api/v1';
    window.open(`${base}/tickets/${ticketId}/pdf?token=${encodeURIComponent(token)}`, '_blank');
  },
};
