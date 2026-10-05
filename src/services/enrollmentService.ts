import type { Enrollment, MyCourse, CourseAccess } from '../types/enrollment.types';
import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';

export const enrollmentService = {
  /**
   * The learner's courses with the server's access verdict attached.
   * This is the only source of truth for "am I enrolled?".
   */
  async getMyCourses(): Promise<MyCourse[]> {
    const { data } = await apiClient.get<MyCourse[]>(ENDPOINTS.enrollments.myCourses);
    return data;
  },

  async getMyEnrollments(): Promise<Enrollment[]> {
    const { data } = await apiClient.get<Enrollment[]>(ENDPOINTS.enrollments.list);
    return data;
  },

  async getEnrollmentAccess(id: string): Promise<CourseAccess> {
    const { data } = await apiClient.get<CourseAccess>(ENDPOINTS.enrollments.access(id));
    return data;
  },
};