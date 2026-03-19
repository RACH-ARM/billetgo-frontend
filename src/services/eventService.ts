import api from './api';
import type { EventFilters, PaginatedEvents, Event } from '../types/event';

export const eventService = {
  getEvents: async (filters?: EventFilters): Promise<PaginatedEvents> => {
    const { data } = await api.get('/events', { params: filters });
    return data.data;
  },

  getEventById: async (id: string): Promise<Event> => {
    const { data } = await api.get(`/events/${id}`);
    return data.data;
  },

  createEvent: async (formData: FormData): Promise<Event> => {
    const { data } = await api.post('/events', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  updateEvent: async (id: string, formData: FormData): Promise<Event> => {
    const { data } = await api.put(`/events/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  updateEventStatus: async (id: string, payload: { status: string; rejectionReason?: string }) => {
    const { data } = await api.patch(`/events/${id}/status`, payload);
    return data.data;
  },
};
