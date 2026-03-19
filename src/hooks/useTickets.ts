import { useQuery } from 'react-query';
import { ticketService } from '../services/ticketService';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export const useMyTickets = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery('my-tickets', ticketService.getMyTickets, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
};

export const useMyOrders = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery(
    'my-orders',
    () => api.get('/orders').then(r => r.data.data),
    { enabled: isAuthenticated, staleTime: 30_000 }
  );
};
