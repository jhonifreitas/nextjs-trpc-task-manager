"use client";

import { useMutation, useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/toast";
import { type Task, TASKS_PAGE_SIZE } from "@/lib/task";
import { useTRPC } from "@/trpc/client";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function TaskList() {
  const trpc = useTRPC();
  // The first page is already in the cache: the server prefetched it (SSR) and hydrated it.
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } =
    useSuspenseInfiniteQuery(
      trpc.task.list.infiniteQueryOptions(
        { limit: TASKS_PAGE_SIZE },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );
  const tasks = data.pages.flatMap((page) => page.items);

  // Infinite scroll: load the next page when the marker below the list gets
  // close to the viewport. It pauses after a failure, so a broken request isn't
  // retried in a loop; the user retries with the button instead.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canLoadMore = hasNextPage && !isFetchingNextPage && !isFetchNextPageError;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canLoadMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, fetchNextPage]);

  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
        No tasks yet.{" "}
        <Link href="/tasks/new" className="font-medium text-blue-600 hover:underline">
          Create the first one
        </Link>
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
      <div ref={sentinelRef} className="py-6 text-center text-sm text-gray-500">
        {isFetchingNextPage ? (
          <span role="status">Loading more tasks…</span>
        ) : isFetchNextPageError ? (
          <span role="alert">
            Couldn&apos;t load more tasks.{" "}
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              className="font-medium text-blue-600 hover:underline"
            >
              Try again
            </button>
          </span>
        ) : !hasNextPage && data.pages.length > 1 ? (
          "You've reached the end of the list."
        ) : null}
      </div>
    </>
  );
}

export function TaskListSkeleton() {
  return (
    <div role="status" aria-label="Loading tasks" className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-20 animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const toast = useToast();
  const deleteTask = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: () => toast.success(`Deleted "${task.titulo}"`),
      onError: (error) => toast.error(`Couldn't delete "${task.titulo}": ${error.message}`),
      // Refresh the list either way (on NOT_FOUND the task was already gone).
      // Returning the promise keeps the item in its "Deleting…" state until the
      // refreshed list replaces it.
      onSettled: () => queryClient.invalidateQueries(trpc.task.pathFilter()),
    }),
  );

  return (
    <li
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-opacity ${
        deleteTask.isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium break-words">{task.titulo}</h2>
          {task.descricao && (
            <p className="mt-1 text-sm whitespace-pre-line break-words text-gray-600">{task.descricao}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Created{" "}
            {/* Formatted in the server's time zone during SSR and in the browser's afterwards:
                they only differ if the server runs in another time zone, so the warning is silenced. */}
            <time dateTime={new Date(task.dataCriacao).toISOString()} suppressHydrationWarning>
              {dateFormat.format(task.dataCriacao)}
            </time>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/tasks/${task.id}/edit`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => deleteTask.mutate({ id: task.id })}
            disabled={deleteTask.isPending}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed"
          >
            {deleteTask.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </li>
  );
}
