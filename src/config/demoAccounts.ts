import type { UserRole } from '../types/auth.types';

/**
 * Accounts created by `python manage.py seed_data`. Only surfaced in a
 * development build - the quick-login row is stripped from release bundles,
 * so these never reach a production login screen.
 */
export const DEMO_ACCOUNTS: Record<UserRole, { email: string; password: string }> = {
  admin: { email: 'admin@learnova.app', password: 'Admin@123' },
  staff: { email: 'staff@learnova.app', password: 'Staff@123' },
  student: { email: 'student@learnova.app', password: 'Student@123' },
};

export const SHOW_DEMO_LOGIN = __DEV__;