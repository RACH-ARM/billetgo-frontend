import api from './api';
import type { CreateOrderPayload, Order, InitiatePaymentPayload } from '../types/ticket';
import { getTrafficSource } from '../utils/trafficSource';

export const paymentService = {
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const traffic = getTrafficSource();
    const { data } = await api.post('/orders', { ...payload, ...traffic });
    return data.data;
  },

  initiatePayment: async (payload: InitiatePaymentPayload) => {
    const { data } = await api.post('/payments/initiate', payload);
    return data.data;
  },

  getPaymentStatus: async (paymentId: string): Promise<{ status: string; orderId: string }> => {
    const { data } = await api.get(`/payments/${paymentId}/status`);
    return data.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const { data } = await api.get('/orders');
    return data.data;
  },
};
