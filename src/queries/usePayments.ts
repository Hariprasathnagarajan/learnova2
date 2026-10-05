import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { queryKeys } from './queryKeys';

export const usePaymentHistory = () =>
  useQuery({ queryKey: queryKeys.payments.history(), queryFn: paymentService.getPaymentHistory });
