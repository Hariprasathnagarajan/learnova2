import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'dd MMM yyyy');
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'dd MMM yyyy, hh:mm a');
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

export function formatSessionTime(iso: string): string {
  return format(parseISO(iso), 'EEE, dd MMM · hh:mm a');
}
