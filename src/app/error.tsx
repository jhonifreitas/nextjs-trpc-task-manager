"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  function retry() {
    // refresh() runs the server components again; reset() then re-renders this segment.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm">{error.message || "An unexpected error occurred."}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}
