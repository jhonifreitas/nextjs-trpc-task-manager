import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { taskStore } from "@/server/task-store";

export function createTRPCContext() {
  return { taskStore };
}

export type TRPCContext = ReturnType<typeof createTRPCContext>;

const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Validation messages per field, so the form can show each one next to its input.
        zodError:
          error.cause instanceof z.ZodError
            ? z.flattenError(error.cause as z.ZodError<Record<string, unknown>>)
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
