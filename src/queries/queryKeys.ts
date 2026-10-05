export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    list: () => [...queryKeys.courses.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.courses.all, 'detail', id] as const,
    sessions: (id: string) => [...queryKeys.courses.all, 'sessions', id] as const,
    materials: (id: string) => [...queryKeys.courses.all, 'materials', id] as const,
    notes: (id: string) => [...queryKeys.courses.all, 'notes', id] as const,
  },
  enrollments: {
    all: ['enrollments'] as const,
    list: () => [...queryKeys.enrollments.all, 'list'] as const,
    myCourses: () => [...queryKeys.enrollments.all, 'my-courses'] as const,
    detail: (id: string) => [...queryKeys.enrollments.all, 'detail', id] as const,
  },
  payments: {
    all: ['payments'] as const,
    history: () => [...queryKeys.payments.all, 'history'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
} as const;
