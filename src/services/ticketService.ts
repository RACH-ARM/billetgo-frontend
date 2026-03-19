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

  downloadTicketPDF: async (ticketId: string): Promise<void> => {
    const response = await api.get(`/tickets/${ticketId}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `billet-${ticketId}.pdf`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};
