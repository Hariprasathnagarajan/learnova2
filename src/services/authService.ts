import type { LoginRequest, RegisterRequest, AuthResponse, OTPVerifyRequest } from '../types/auth.types';
import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';
import { saveTokens, saveUser, clearAuth } from '../utils/storageUtils';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { data: res } = await apiClient.post<AuthResponse>(ENDPOINTS.auth.login, data);
    await saveTokens(res.tokens.access, res.tokens.refresh);
    await saveUser(res.user);
    return res;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { data: res } = await apiClient.post<AuthResponse>(ENDPOINTS.auth.register, data);

    // The API issues tokens on successful registration. Persist them so the
    // new learner lands straight in the app instead of being bounced to login.
    if (res?.tokens) {
      await saveTokens(res.tokens.access, res.tokens.refresh);
      await saveUser(res.user);
    }

    return res;
  },

  async verifyOTP(data: OTPVerifyRequest): Promise<AuthResponse> {
    const { data: res } = await apiClient.post<AuthResponse>(ENDPOINTS.auth.otpVerify, data);
    await saveTokens(res.tokens.access, res.tokens.refresh);
    await saveUser(res.user);
    return res;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(ENDPOINTS.auth.forgotPassword, { email });
    return data;
  },

  async logout(): Promise<void> {
    await clearAuth();
  },
};