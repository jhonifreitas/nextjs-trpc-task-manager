import { createTRPCRouter } from "../init";
import { taskRouter } from "./task";

export const appRouter = createTRPCRouter({
  task: taskRouter,
});

// Only this type reaches the client: tRPC infers every input and output from it.
export type AppRouter = typeof appRouter;
