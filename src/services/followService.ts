import api from './api';

export const followService = {
  toggleFollow: async (organizerId: string): Promise<{ following: boolean; followerCount: number }> => {
    const { data } = await api.post(`/organizers/${organizerId}/follow`);
    return data.data;
  },

  getFollowing: async (): Promise<{ organizerIds: string[] }> => {
    const { data } = await api.get('/organizers/following');
    return data.data;
  },
};
