import type { Course, Session, Material, Note, PaymentPlan } from '../types/course.types';
import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';

/**
 * Sessions, materials and notes are only ever served as
 * `{ access, results }` - the server decides whether the caller may see them,
 * so the client just unwraps and lets a 403 surface as a thrown error.
 */
interface ProtectedList<T> {
  access: { hasAccess: boolean; accessStatus: string; reason: string; expiresAt: string | null };
  results: T[];
}

const unwrap = <T>(payload: ProtectedList<T>): T[] => payload.results ?? [];

export const courseService = {
  async getCourses(): Promise<Course[]> {
    const { data } = await apiClient.get<Course[]>(ENDPOINTS.courses.list);
    return data;
  },

  async getCourse(id: string): Promise<Course> {
    const { data } = await apiClient.get<Course>(ENDPOINTS.courses.detail(id));
    return data;
  },

  async getProtectedDetail(id: string): Promise<Course> {
    const { data } = await apiClient.get<Course>(ENDPOINTS.courses.protectedDetail(id));
    return data;
  },

  async getCourseSessions(courseId: string): Promise<Session[]> {
    const { data } = await apiClient.get<ProtectedList<Session>>(ENDPOINTS.courses.sessions(courseId));
    return unwrap(data);
  },

  async getCourseMaterials(courseId: string): Promise<Material[]> {
    const { data } = await apiClient.get<ProtectedList<Material>>(ENDPOINTS.courses.materials(courseId));
    return unwrap(data);
  },

  async getCourseNotes(courseId: string): Promise<Note[]> {
    const { data } = await apiClient.get<ProtectedList<Note>>(ENDPOINTS.courses.notes(courseId));
    return unwrap(data);
  },

  async getPaymentPlans(courseId: string): Promise<PaymentPlan[]> {
    const { data } = await apiClient.get<PaymentPlan[]>(ENDPOINTS.courses.paymentPlans(courseId));
    return data;
  },
};