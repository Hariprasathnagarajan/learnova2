import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'learnova_access_token',
  REFRESH_TOKEN: 'learnova_refresh_token',
  USER: 'learnova_user',
} as const;

export async function saveTokens(access: string, refresh: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(KEYS.ACCESS_TOKEN, access);
      localStorage.setItem(KEYS.REFRESH_TOKEN, refresh);
    } catch (e) {
      console.warn('localStorage saveTokens failed', e);
    }
    return;
  }
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, access);
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refresh);
}

export async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

export async function saveUser(user: object): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.warn('localStorage saveUser failed', e);
    }
    return;
  }
  await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
}

export async function getUser<T>(): Promise<T | null> {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(KEYS.USER);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
  const raw = await SecureStore.getItemAsync(KEYS.USER);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function clearAuth(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
      localStorage.removeItem(KEYS.USER);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(KEYS.USER);
}

