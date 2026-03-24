import api from './api';

export interface OrganizerProfileData {
  id: string;
  companyName: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  mobileMoneyNumber: string | null;
  isApproved: boolean;
  isCertified: boolean;
  isPremium: boolean;
  kycDocumentUrl: string | null;
  kycSubmittedAt: string | null;
  commissionRate: number;
}

export interface FullProfile {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  notificationsEnabled: boolean;
  avatarUrl: string | null;
  createdAt: string;
  organizer: OrganizerProfileData | null;
}

export interface WaitlistEntry {
  id: string;
  eventId: string;
  email: string;
  phone: string | null;
  notified: boolean;
  createdAt: string;
  event: {
    id: string;
    title: string;
    coverImageUrl: string | null;
    eventDate: string;
    venueName: string;
    venueCity: string;
    status: string;
  };
}

export const getMe = async (): Promise<FullProfile> => {
  const { data } = await api.get('/auth/me');
  return data.data;
};

export const updateMe = async (payload: {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
}): Promise<Partial<FullProfile>> => {
  const { data } = await api.patch('/auth/me', payload);
  return data.data;
};

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  await api.patch('/auth/me/password', payload);
};

export const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.post('/auth/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const getMyWaitlist = async (): Promise<WaitlistEntry[]> => {
  const { data } = await api.get('/auth/me/waitlist');
  return data.data;
};

export const updateNotifications = async (enabled: boolean): Promise<void> => {
  await api.patch('/auth/me/notifications', { notificationsEnabled: enabled });
};

export const deleteAccount = async (): Promise<void> => {
  await api.delete('/auth/me');
};

export const updateOrganizerProfile = async (payload: {
  mobileMoneyNumber?: string;
  companyName?: string;
  description?: string | null;
  website?: string | null;
}): Promise<Partial<OrganizerProfileData>> => {
  const { data } = await api.patch('/organizer/profile', payload);
  return data.data;
};

export const uploadOrganizerLogo = async (file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  const { data } = await api.post('/organizer/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const uploadEventGallery = async (eventId: string, files: File[]): Promise<{ galleryUrls: string[] }> => {
  const formData = new FormData();
  files.forEach((f) => formData.append('photos', f));
  const { data } = await api.post(`/organizer/events/${eventId}/gallery`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const deleteEventGalleryPhoto = async (eventId: string, url: string): Promise<{ galleryUrls: string[] }> => {
  const { data } = await api.delete(`/organizer/events/${eventId}/gallery`, { data: { url } });
  return data.data;
};
