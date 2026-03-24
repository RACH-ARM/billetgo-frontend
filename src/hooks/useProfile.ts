import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  getMe, updateMe, changePassword, uploadAvatar,
  getMyWaitlist, updateNotifications, deleteAccount,
  updateOrganizerProfile, uploadOrganizerLogo,
} from '../services/userService';
import { useAuthStore } from '../stores/authStore';

export const useMe = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery('me', getMe, { staleTime: 2 * 60 * 1000, enabled: isAuthenticated });
};

export const useUpdateMe = () => {
  const qc = useQueryClient();
  const { updateUser } = useAuthStore();
  return useMutation(updateMe, {
    onSuccess: (data) => {
      qc.invalidateQueries('me');
      // Synchronise le store Zustand pour que la sidebar reflète les changements immédiatement
      if (data?.firstName !== undefined) updateUser({ firstName: data.firstName });
      if (data?.lastName  !== undefined) updateUser({ lastName:  data.lastName  });
      if (data?.avatarUrl !== undefined) updateUser({ avatarUrl: data.avatarUrl });
    },
  });
};

export const useChangePassword = () =>
  useMutation(changePassword);

export const useUploadAvatar = () => {
  const qc = useQueryClient();
  return useMutation(uploadAvatar, { onSuccess: () => qc.invalidateQueries('me') });
};

export const useMyWaitlist = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery('my-waitlist', getMyWaitlist, { staleTime: 60_000, enabled: isAuthenticated });
};

export const useUpdateNotifications = () => {
  const qc = useQueryClient();
  return useMutation(updateNotifications, { onSuccess: () => qc.invalidateQueries('me') });
};

export const useDeleteAccount = () =>
  useMutation(deleteAccount);

export const useUpdateOrganizerProfile = () => {
  const qc = useQueryClient();
  return useMutation(updateOrganizerProfile, { onSuccess: () => qc.invalidateQueries('me') });
};

export const useUploadOrganizerLogo = () => {
  const qc = useQueryClient();
  return useMutation(uploadOrganizerLogo, { onSuccess: () => qc.invalidateQueries('me') });
};
