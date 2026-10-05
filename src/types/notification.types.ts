// Notification Types
export type NotificationType = 'session_reminder' | 'payment_success' | 'payment_failed' | 'course_update' | 'material_added' | 'announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, string>;
  createdAt: string;
}
