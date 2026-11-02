import type { Metadata } from "next";
import { TaskForm } from "@/components/task-form";

export const metadata: Metadata = { title: "New task" };

export default function NewTaskPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">New task</h1>
      <TaskForm />
    </>
  );
}
