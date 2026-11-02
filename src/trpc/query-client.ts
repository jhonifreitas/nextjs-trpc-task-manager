import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data prefetched on the server is still fresh when it reaches the
        // browser, so the client doesn't refetch it right after hydration.
        staleTime: 30 * 1000,
      },
    },
  });
}
