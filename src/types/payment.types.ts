// Payment Types
export type PaymentStatus = 'created' | 'pending' | 'successful' | 'failed' | 'refunded';
export type PaymentGateway = 'razorpay';

export interface Payment {
  id: string;
  orderId: string;
  courseId: string;
  userId: string;
  planId?: string;
  amountInr: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  createdAt: string;
}

export interface CreateOrderRequest {
  courseId: string;
  planId: string;
}

export interface CreateOrderResponse {
  /** Order id issued by Razorpay - this is what checkout must be opened with. */
  orderId: string;
  /** Locally generated reference, used as the gateway receipt. */
  receiptId: string;
  amountInr: number;
  currency: string;
  courseId: string;
  planId: string | null;
  durationMonths: number | null;
  razorpayKeyId: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  orderId: string;
  paymentId: string;
  courseId: string;
  enrollmentId: string;
  accessStatus: string;
  expiresAt: string | null;
}