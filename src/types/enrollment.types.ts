// Enrollment Types
export type EnrollmentStatus = 'active' | 'completed' | 'suspended' | 'cancelled' | 'pending';

/** Server-authoritative access states (spec 11). The client never derives these. */
export type AccessStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED';

export interface CourseAccess {
  hasAccess: boolean;
  accessStatus: AccessStatus;
  reason: string;
  enrollmentId: string;
  expiresAt: string | null;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  paymentPlanId: string;
  paymentStatus: string;
  status: EnrollmentStatus;
  accessStatus: AccessStatus;
  hasAccess: boolean;
  progressPercent: number;
  expiresAt: string | null;
  enrolledAt: string;
  completedAt: string | null;
}

/** Element shape of GET /enrollments/my-courses/ */
export interface MyCourse {
  enrollment: Enrollment;
  access: CourseAccess;
}