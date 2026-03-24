import { useMutation, useQueryClient } from 'react-query';
import { paymentService } from '../services/paymentService';
import type { CreateOrderPayload, InitiatePaymentPayload } from '../types/ticket';

export const useCreateOrder = () => {
  return useMutation((payload: CreateOrderPayload) => paymentService.createOrder(payload));
};

export const useInitiatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: InitiatePaymentPayload) => paymentService.initiatePayment(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-tickets');
        queryClient.invalidateQueries('events');
        queryClient.invalidateQueries('event');
      },
    }
  );
};
