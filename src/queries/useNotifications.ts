import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { queryKeys } from './queryKeys';

export const useNotifications = () =>
  useQuery({ queryKey: queryKeys.notifications.list(), queryFn: notificationService.getNotifications, refetchInterval: 60000 });
