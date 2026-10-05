import { useQuery } from '@tanstack/react-query';
import { courseService } from '../services/courseService';
import { queryKeys } from './queryKeys';

export const useCourses = () =>
  useQuery({ queryKey: queryKeys.courses.list(), queryFn: courseService.getCourses, staleTime: 1000 * 60 * 5 });

export const useCourse = (id: string) =>
  useQuery({ queryKey: queryKeys.courses.detail(id), queryFn: () => courseService.getCourse(id), staleTime: 1000 * 60 * 5 });

export const useCourseSessions = (courseId: string) =>
  useQuery({ queryKey: queryKeys.courses.sessions(courseId), queryFn: () => courseService.getCourseSessions(courseId) });

export const useCourseMaterials = (courseId: string) =>
  useQuery({ queryKey: queryKeys.courses.materials(courseId), queryFn: () => courseService.getCourseMaterials(courseId) });

export const useCourseNotes = (courseId: string) =>
  useQuery({ queryKey: queryKeys.courses.notes(courseId), queryFn: () => courseService.getCourseNotes(courseId) });
