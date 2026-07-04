import api from './api';

export const likeService = {
  toggleLike: async (eventId: string): Promise<{ liked: boolean; likeCount: number }> => {
    const { data } = await api.post(`/events/${eventId}/like`);
    return data.data;
  },

  getLikedEvents: async (): Promise<{ eventIds: string[] }> => {
    const { data } = await api.get('/events/liked');
    return data.data;
  },
};
