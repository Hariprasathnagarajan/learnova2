import RazorpayCheckout from 'react-native-razorpay';

import { env } from '../config/env';
import { paymentService } from './paymentService';
import type { CreateOrderRequest, CreateOrderResponse } from '../types/payment.types';

/** Razorpay SDK error code for a user-initiated cancel. */
const CODE_CANCELLED = 2;

export interface BuyerProfile {
  name: string;
  email: string;
  phone?: string;
}

export interface CheckoutResult {
  orderId: string;
  paymentId: string;
  signature: string;
}

export class PaymentCancelledError extends Error {
  constructor() {
    super('Payment cancelled');
    this.name = 'PaymentCancelledError';
  }
}

/**
 * Runs a real Razorpay checkout and returns the gateway's signed result.
 *
 * The signature is produced by Razorpay's SDK, never invented here - the server
 * recomputes the HMAC against its own key secret and rejects anything that does
 * not match, so a tampered client cannot grant itself an enrolment.
 *
 * The SDK emits no event when the sheet is dismissed, so a dismissal has to be
 * routed through `modal.ondismiss` or the returned promise would never settle
 * and the caller would spin forever.
 */
export async function runRazorpayCheckout(
  request: CreateOrderRequest,
  buyer: BuyerProfile,
  onFinish: () => void,
): Promise<CheckoutResult> {
  const order: CreateOrderResponse = await paymentService.createOrder(request);

  const keyId = order.razorpayKeyId || env.razorpayKeyId;
  if (!keyId) {
    onFinish();
    throw new Error('Payment gateway is not configured. Please contact support.');
  }

  // The SDK emits no event when the sheet is dismissed, so dismissal is turned
  // into a rejection and raced against the checkout promise - otherwise neither
  // settles and the caller spins forever.
  let rejectOnDismiss: (reason: Error) => void = () => {};
  const dismissed = new Promise<never>((_, reject) => {
    rejectOnDismiss = reject;
  });

  try {
    const response = await Promise.race([
      RazorpayCheckout.open({
        key: keyId,
        amount: order.amountInr * 100,
        currency: order.currency,
        name: 'Learnova',
        description: 'Course enrolment',
        order_id: order.orderId,
        prefill: {
          name: buyer.name,
          email: buyer.email,
          contact: buyer.phone ?? '',
        },
        theme: { color: '#080B14' },
        modal: {
          ondismiss: () => rejectOnDismiss(new PaymentCancelledError()),
        },
      }),
      dismissed,
    ]);

    return {
      orderId: String(response.razorpay_order_id ?? order.orderId),
      paymentId: String(response.razorpay_payment_id ?? ''),
      signature: String(response.razorpay_signature ?? ''),
    };
  } catch (error) {
    if ((error as { code?: number })?.code === CODE_CANCELLED) {
      throw new PaymentCancelledError();
    }
    throw error;
  } finally {
    onFinish();
  }
}