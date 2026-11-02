import { Suspense } from "react";
import { TaskList, TaskListSkeleton } from "@/components/task-list";
import { TASKS_PAGE_SIZE } from "@/lib/task";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

// Render on every request (SSR). Nothing here depends on the request, so
// without this Next.js would prerender the page once at build time (SSG) and
// always show the tasks that existed back then.
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  // SSR: the first page of tasks is fetched on the server, rendered into the
  // HTML and handed to the client cache, so the browser doesn't fetch it again.
  await getQueryClient().prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      { limit: TASKS_PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Tasks</h1>
      <HydrateClient>
        {/* Only shown if the list has no data yet (e.g. the prefetch failed). */}
        <Suspense fallback={<TaskListSkeleton />}>
          <TaskList />
        </Suspense>
      </HydrateClient>
    </>
  );
}
