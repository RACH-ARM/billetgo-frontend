import { QueryClient } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
