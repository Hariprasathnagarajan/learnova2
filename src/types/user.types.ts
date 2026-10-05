// User Types (admin perspective)
export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'staff' | 'admin';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  enrollmentCount?: number;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateStaffRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}
