export const colors = {
  background: '#080B14',
  surface: {
    primary: '#101625',
    secondary: '#151D30',
    elevated: '#192238',
  },
  border: '#202A3D',
  primary: '#6366F1',
  primaryPressed: '#5558E8',
  accent: '#22D3EE',
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#38BDF8',
  overlay: 'rgba(8, 11, 20, 0.85)',
} as const;

export type Colors = typeof colors;
