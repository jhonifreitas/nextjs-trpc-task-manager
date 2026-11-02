"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { z } from "zod";
import { useToast } from "@/components/toast";
import { DESCRIPTION_MAX_LENGTH, type Task, TITLE_MAX_LENGTH } from "@/lib/task";
import { type TaskInput, taskInputSchema } from "@/lib/task-schema";
import { useTRPC } from "@/trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";

type FieldErrors = Partial<Record<keyof TaskInput, string[]>>;

const inputClassName =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none aria-invalid:border-red-500";

/** Creates a new task, or edits `task` when one is given. */
export function TaskForm({ task }: { task?: Task }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState({ titulo: task?.titulo ?? "", descricao: task?.descricao ?? "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isNavigating, startNavigation] = useTransition();

  async function onSuccess() {
    await queryClient.invalidateQueries(trpc.task.pathFilter());
    toast.success(task ? "Task updated" : "Task created");
    startNavigation(() => router.push("/"));
  }

  // The server validates with the same schema; if it still rejects a field, show why.
  function onError(error: TRPCClientErrorLike<AppRouter>) {
    setFieldErrors(error.data?.zodError?.fieldErrors ?? {});
  }

  const createTask = useMutation(trpc.task.create.mutationOptions({ onSuccess, onError }));
  const updateTask = useMutation(trpc.task.update.mutationOptions({ onSuccess, onError }));
  const mutation = task ? updateTask : createTask;
  const isSaving = mutation.isPending || isNavigating;

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.reset();
    // Invalid input (e.g. an empty title) is caught here and never sent.
    const result = taskInputSchema.safeParse(values);
    if (!result.success) {
      setFieldErrors(z.flattenError(result.error).fieldErrors);
      return;
    }
    setFieldErrors({});
    if (task) updateTask.mutate({ id: task.id, ...result.data });
    else createTask.mutate(result.data);
  }

  // Validation errors are shown next to their fields; anything else goes here.
  const formError = mutation.error && !mutation.error.data?.zodError ? mutation.error.message : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="titulo" className="block text-sm font-medium">
          Title <span className="text-red-600">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          value={values.titulo}
          onChange={handleChange}
          required
          maxLength={TITLE_MAX_LENGTH}
          autoFocus
          aria-invalid={Boolean(fieldErrors.titulo)}
          aria-describedby={fieldErrors.titulo ? "titulo-error" : undefined}
          className={inputClassName}
        />
        {fieldErrors.titulo && (
          <p id="titulo-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.titulo[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="descricao" className="block text-sm font-medium">
          Description <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          value={values.descricao}
          onChange={handleChange}
          maxLength={DESCRIPTION_MAX_LENGTH}
          aria-invalid={Boolean(fieldErrors.descricao)}
          aria-describedby={fieldErrors.descricao ? "descricao-error" : undefined}
          className={inputClassName}
        />
        {fieldErrors.descricao && (
          <p id="descricao-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.descricao[0]}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Couldn&apos;t save the task: {formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link href="/" className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : task ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}
