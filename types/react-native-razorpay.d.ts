/**
 * Ambient types for `react-native-razorpay` v3.
 *
 * The package ships its own types at `src/types.ts` but its `package.json`
 * declares no `types`/`typings` entry, so TypeScript cannot reach them.
 * These declarations mirror the upstream source so the payment bridge stays
 * type-safe. Re-check against `node_modules/react-native-razorpay/src/types.ts`
 * when upgrading the package.
 */
declare module 'react-native-razorpay' {
  export type RazorpayOptions = {
    key: string;
    /** Minor units (paise). 1000 === INR 10. */
    amount: number | string;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    order_id?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
      color?: string;
      hide_topbar?: boolean;
    };
    modal?: {
      backdropclose?: boolean;
      escape?: boolean;
      handleback?: boolean;
      confirm_close?: boolean;
      ondismiss?: () => void;
      animation?: boolean;
    };
    subscription_id?: string;
    subscription_card_change?: boolean;
    recurring?: boolean | string;
    callback_url?: string;
    redirect?: boolean;
    customer_id?: string;
    remember_customer?: boolean;
    timeout?: number;
    readonly?: {
      email?: boolean;
      contact?: boolean;
      name?: boolean;
    };
    hidden?: {
      email?: boolean;
      contact?: boolean;
    };
  };

  export type PaymentSuccessData = {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    [key: string]: unknown;
  };

  export type PaymentErrorData = {
    /** 0 = failed, 1 = external wallet selected, 2 = user cancelled. */
    code: number;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id?: string;
      payment_id?: string;
      [key: string]: unknown;
    };
  };

  export type ExternalWalletData = {
    external_wallet: string;
    [key: string]: unknown;
  };

  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<PaymentSuccessData>;
    onExternalWalletSelection(callback: (data: ExternalWalletData) => void): void;
  };

  export default RazorpayCheckout;
}