import { useQuery } from '@tanstack/react-query';
import { enrollmentService } from '../services/enrollmentService';
import { queryKeys } from './queryKeys';

/** The learner's courses with the server's access verdict attached. */
export const useMyCourses = () =>
  useQuery({ queryKey: queryKeys.enrollments.myCourses(), queryFn: enrollmentService.getMyCourses });

/** Flat enrolment records, for history-style screens. */
export const useEnrollments = () =>
  useQuery({ queryKey: queryKeys.enrollments.list(), queryFn: enrollmentService.getMyEnrollments });

export const useEnrollmentAccess = (id: string) =>
  useQuery({
    queryKey: queryKeys.enrollments.detail(id),
    queryFn: () => enrollmentService.getEnrollmentAccess(id),
    enabled: !!id,
  });