import type {
  Payment, CreateOrderRequest, CreateOrderResponse,
  VerifyPaymentRequest, VerifyPaymentResponse,
} from '../types/payment.types';
import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';

export const paymentService = {
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const { data: res } = await apiClient.post<CreateOrderResponse>(ENDPOINTS.payments.createOrder, data);
    return res;
  },

  /** Only a gateway-issued signature can settle an order; the server verifies it. */
  async verifyPayment(data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    const { data: res } = await apiClient.post<VerifyPaymentResponse>(ENDPOINTS.payments.verify, data);
    return res;
  },

  async getPaymentHistory(): Promise<Payment[]> {
    const { data } = await apiClient.get<Payment[]>(ENDPOINTS.payments.history);
    return data;
  },

  /** Staff-only roster of learners on a course the caller is assigned to. */
  async getCourseStudents(courseId: string) {
    const { data } = await apiClient.get(ENDPOINTS.payments.courseStudents(courseId));
    return data;
  },

  async getCoursePayments(courseId: string) {
    const { data } = await apiClient.get(ENDPOINTS.payments.coursePayments(courseId));
    return data;
  },
};