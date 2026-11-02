import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/task";
import { createTaskStore } from "@/server/task-store";
import { createCallerFactory } from "../init";
import { appRouter } from "./_app";

const createCaller = createCallerFactory(appRouter);

// Each test gets its own empty (or pre-filled) store instead of the shared one.
function setup(initialTasks: Task[] = []) {
  return createCaller({ taskStore: createTaskStore(initialTasks) });
}

describe("task router", () => {
  it("creates a task with a generated id and creation timestamp", async () => {
    const caller = setup();

    const task = await caller.task.create({ titulo: "  Write tests  ", descricao: "With Vitest" });

    expect(task).toMatchObject({ titulo: "Write tests", descricao: "With Vitest" });
    expect(task.id).toEqual(expect.any(String));
    expect(task.dataCriacao).toBeLessThanOrEqual(Date.now());
    expect(await caller.task.byId({ id: task.id })).toEqual(task);
  });

  it("rejects a task without a title", async () => {
    const caller = setup();

    await expect(caller.task.create({ titulo: "   " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await caller.task.list({})).items).toHaveLength(0);
  });

  it("updates an existing task", async () => {
    const caller = setup();
    const task = await caller.task.create({ titulo: "Draft", descricao: "Old description" });

    const updated = await caller.task.update({ id: task.id, titulo: "Final", descricao: "" });

    expect(updated).toEqual({ ...task, titulo: "Final", descricao: undefined });
  });

  it("deletes an existing task", async () => {
    const caller = setup();
    const task = await caller.task.create({ titulo: "Temporary" });

    await expect(caller.task.delete({ id: task.id })).resolves.toEqual({ id: task.id });
    await expect(caller.task.byId({ id: task.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns NOT_FOUND for a task that doesn't exist", async () => {
    const caller = setup();

    await expect(caller.task.update({ id: "missing", titulo: "Anything" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(caller.task.delete({ id: "missing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("paginates newest first without skipping tasks deleted between pages", async () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({
      id: `task-${i}`,
      titulo: `Task ${i}`,
      dataCriacao: 1_000 + i,
    }));
    const caller = setup(tasks);

    const first = await caller.task.list({ limit: 2 });
    expect(first.items.map((task) => task.id)).toEqual(["task-4", "task-3"]);

    await caller.task.delete({ id: "task-4" });

    const second = await caller.task.list({ limit: 2, cursor: first.nextCursor });
    expect(second.items.map((task) => task.id)).toEqual(["task-2", "task-1"]);

    const third = await caller.task.list({ limit: 2, cursor: second.nextCursor });
    expect(third.items.map((task) => task.id)).toEqual(["task-0"]);
    expect(third.nextCursor).toBeNull();
  });
});
