// Course Types
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type SessionPlatform = 'zoom' | 'google_meet' | 'teams';

export interface CourseInstructor {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  instructor: CourseInstructor;
  level: CourseLevel;
  status: CourseStatus;
  category: string;
  tags: string[];
  rating: number;
  ratingCount: number;
  enrolledCount: number;
  durationWeeks: number;
  totalSessions: number;
  paymentPlans: PaymentPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPlan {
  id: string;
  courseId: string;
  name: string;
  description: string;
  priceInr: number;
  currency: string;
  planType: 'full' | 'installment' | 'emi';
  durationMonths: number;
  duration: string;
  installments: number;
  installmentAmountInr: number | null;
  isPopular: boolean;
  features: string[];
}

export interface Session {
  id: string;
  courseId: string;
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  platform: SessionPlatform;
  isCompleted: boolean;
  recordingAvailable: boolean;
}

// Admin-only type — includes meeting URL
export interface SessionAdmin extends Session {
  meetingUrl: string;
  meetingId?: string;
  meetingPassword?: string;
}

export interface Material {
  id: string;
  courseId: string;
  sessionId?: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'link' | 'image';
  thumbnailUrl?: string;
  sizeBytes?: number;
  isProtected: boolean;
  uploadedAt: string;
}

export interface Note {
  id: string;
  courseId: string;
  sessionId?: string;
  title: string;
  content: string; // markdown
  createdAt: string;
  updatedAt: string;
}
