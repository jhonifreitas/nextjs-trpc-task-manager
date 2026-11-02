import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { TASKS_PAGE_SIZE } from "@/lib/task";
import { taskInputSchema } from "@/lib/task-schema";
import { baseProcedure, createTRPCRouter } from "../init";

const taskIdInput = z.object({ id: z.string() });

function taskNotFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
}

export const taskRouter = createTRPCRouter({
  list: baseProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(TASKS_PAGE_SIZE),
        // The last task of the previous page; empty for the first page.
        cursor: z.object({ dataCriacao: z.number(), id: z.string() }).nullish(),
      }),
    )
    .query(({ ctx, input }) => ctx.taskStore.list(input)),

  byId: baseProcedure
    .input(taskIdInput)
    .query(({ ctx, input }) => ctx.taskStore.get(input.id) ?? taskNotFound()),

  create: baseProcedure
    .input(taskInputSchema)
    .mutation(({ ctx, input }) => ctx.taskStore.create(input)),

  update: baseProcedure
    .input(taskInputSchema.extend(taskIdInput.shape))
    .mutation(({ ctx, input }) => ctx.taskStore.update(input.id, input) ?? taskNotFound()),

  delete: baseProcedure.input(taskIdInput).mutation(({ ctx, input }) => {
    if (!ctx.taskStore.delete(input.id)) taskNotFound();
    return { id: input.id };
  }),
});
