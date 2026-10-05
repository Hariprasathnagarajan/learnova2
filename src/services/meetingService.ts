import { Linking } from 'react-native';

import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';
import type { SessionAdmin } from '../types/course.types';

/**
 * The meeting URL is minted by the server per request, only for a learner with
 * a live enrolment, and only inside the join window. It is never part of a
 * course or session listing.
 */
export const meetingService = {
  async joinSession(sessionId: string): Promise<string> {
    const { data } = await apiClient.post<{ joinUrl: string }>(ENDPOINTS.sessions.join(sessionId));
    await Linking.openURL(data.joinUrl);
    return data.joinUrl;
  },

  /** Admin/staff only - this is the one place a meeting URL may be revealed. */
  async getSessionAdminDetail(sessionId: string): Promise<SessionAdmin> {
    const { data } = await apiClient.get<SessionAdmin>(ENDPOINTS.sessions.adminDetail(sessionId));
    return data;
  },
};