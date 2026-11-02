import { z } from "zod";
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from "./task";

// Used by both the tRPC procedures and the task form, so the server and the
// browser validate a task with exactly the same rules and messages.
// (Kept apart from ./task so pages that don't validate don't ship Zod.)
export const taskInputSchema = z.object({
  titulo: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`),
  descricao: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
