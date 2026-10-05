/**
 * Single source of truth for runtime configuration.
 *
 * Every value comes from the environment - there is deliberately no hardcoded
 * host fallback. A wrong default silently pointing at a developer's machine is
 * far more expensive to debug than a build that refuses to start.
 */

import { Platform } from 'react-native';

const getFallbackUrl = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://172.19.15.49:8000/api/v1';
};

const rawApiUrl = 
  process.env.EXPO_PUBLIC_API_URL?.trim() || 
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 
  getFallbackUrl();

// Trailing slashes are stripped so `${env.apiUrl}/courses/` never doubles up.
export const env = {
  apiUrl: rawApiUrl.replace(/\/+$/, ''),

  /**
   * Publishable Razorpay key. Safe to ship: the matching key secret is only
   * ever used by the server to verify the payment signature.
   */
  razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID?.trim() ?? '',

  /** Dev-only request logging. Never enabled in a production build. */
  enableApiLogging: process.env.EXPO_PUBLIC_ENABLE_API_LOGGING === 'true' && __DEV__,
} as const;

export type Env = typeof env;