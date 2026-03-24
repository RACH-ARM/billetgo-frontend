export type UserRole = 'BUYER' | 'ORGANIZER' | 'SCANNER' | 'ADMIN';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string | null;
  notificationsEnabled?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterPayload {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  companyName?: string;
  cguAcceptedAt?: string;
}
