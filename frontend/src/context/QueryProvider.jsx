'use client';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Immediately stale, will re-fetch in background
      gcTime: 1000 * 60 * 30, // 30 minutes cache (previously cacheTime in v4)
      refetchOnWindowFocus: true, // Fetch fresh data when user returns to tab
      retry: 1,
    },
  },
});

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
