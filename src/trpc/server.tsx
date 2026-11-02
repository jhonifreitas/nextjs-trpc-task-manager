import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createCallerFactory, createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

// One QueryClient per request: React's cache() scopes it to a single server render.
export const getQueryClient = cache(makeQueryClient);

// tRPC for Server Components: calls the router directly, without an HTTP round trip.
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

// For data that only the server component needs (not shared with the client cache).
export const caller = createCallerFactory(appRouter)(createTRPCContext);

/** Sends the queries prefetched during this request to the client cache. */
export function HydrateClient({ children }: { children: React.ReactNode }) {
  return <HydrationBoundary state={dehydrate(getQueryClient())}>{children}</HydrationBoundary>;
}
