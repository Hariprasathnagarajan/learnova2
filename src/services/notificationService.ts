import type { Notification } from '../types/notification.types';
import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const { data } = await apiClient.get<Notification[]>(ENDPOINTS.notifications.list);
    return data;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.post(ENDPOINTS.notifications.markRead(id));
  },

  async markAllRead(): Promise<void> {
    await apiClient.post(ENDPOINTS.notifications.markAllRead);
  },
};