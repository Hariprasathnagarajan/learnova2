import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';
import type { UserListItem, CreateStaffRequest } from '../types/user.types';
import type { Course, Session } from '../types/course.types';
import type { Payment } from '../types/payment.types';

export interface MonthlyRevenue {
  month: string;
  revenueInr: number;
}

export interface AdminDashboardStats {
  totalRevenueInr: number;
  totalStudents: number;
  totalUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrolled: number;
  activeEnrollments: number;
  totalSessions: number;
  unreadNotifications: number;
  monthlyGrowthPercent: number;
  recentPayments: Payment[];
  monthlyRevenue: MonthlyRevenue[];
}

export interface StaffDashboardStats {
  assignedCourses: Course[];
  assignedCourseCount: number;
  myStudents: number;
  upcomingSessions: Session[];
  unreadNotifications: number;
}

export const adminService = {
  /** Admin only. Every figure is computed from the database, never hardcoded. */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const { data } = await apiClient.get<AdminDashboardStats>(ENDPOINTS.admin.dashboard);
    return data;
  },

  async getStaffDashboard(): Promise<StaffDashboardStats> {
    const { data } = await apiClient.get<StaffDashboardStats>(ENDPOINTS.admin.staffDashboard);
    return data;
  },

  /** Admin sees every role; staff see only the student roster. */
  async getUsers(): Promise<UserListItem[]> {
    const { data } = await apiClient.get<UserListItem[]>(ENDPOINTS.users.list);
    return data;
  },

  async getUser(id: string): Promise<UserListItem> {
    const { data } = await apiClient.get<UserListItem>(ENDPOINTS.users.detail(id));
    return data;
  },

  async createStaff(data: CreateStaffRequest): Promise<UserListItem> {
    const { data: res } = await apiClient.post<UserListItem>(ENDPOINTS.users.createStaff, data);
    return res;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.users.detail(id));
  },

  /** Admin only - course authoring is not available to staff or students. */
  async createCourse(course: Partial<Course>): Promise<Course> {
    const { data } = await apiClient.post<Course>(ENDPOINTS.courses.list, course);
    return data;
  },

  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.courses.detail(id));
  },

  async getAllPayments(): Promise<Payment[]> {
    const { data } = await apiClient.get<Payment[]>(ENDPOINTS.payments.history);
    return data;
  },

  async assignStaffToCourse(courseId: string, userId: string) {
    const { data } = await apiClient.post(ENDPOINTS.admin.assignStaff(courseId), { userId });
    return data;
  },
};