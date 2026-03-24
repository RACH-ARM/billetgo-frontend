import { useQuery } from 'react-query';
import { eventService } from '../services/eventService';
import type { EventFilters } from '../types/event';

export const useEvents = (filters?: EventFilters, options?: { enabled?: boolean }) => {
  return useQuery(['events', filters], () => eventService.getEvents(filters), {
    keepPreviousData: true,
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
};

export const useEvent = (id: string) => {
  return useQuery(['event', id], () => eventService.getEventById(id), {
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};
