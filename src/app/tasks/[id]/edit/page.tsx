import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { caller } from "@/trpc/server";

export const metadata: Metadata = { title: "Edit task" };

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // SSR: the form arrives already filled in with the current task.
  const task = await caller.task.byId({ id }).catch((error: unknown) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Edit task</h1>
      {/* The key resets the form state when navigating from one task's edit page to another's. */}
      <TaskForm key={task.id} task={task} />
    </>
  );
}
