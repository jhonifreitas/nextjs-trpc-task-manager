import type { Task } from "@/lib/task";
import type { TaskInput } from "@/lib/task-schema";

export type TaskCursor = Pick<Task, "dataCriacao" | "id">;

// Newest first. Tasks created in the same millisecond are ordered by id, so the
// order is always the same and pagination never repeats or skips a task.
function newestFirst(a: TaskCursor, b: TaskCursor) {
  return b.dataCriacao - a.dataCriacao || b.id.localeCompare(a.id);
}

/** In-memory task repository: the data lives as long as the server process. */
export function createTaskStore(initialTasks: Task[] = []) {
  const tasks = new Map(initialTasks.map((task) => [task.id, task]));

  return {
    /**
     * Keyset pagination: the cursor is the last task the client already has
     * (not an offset), so deleting tasks between two pages doesn't shift the
     * next page and make it skip a task.
     */
    list({ limit, cursor }: { limit: number; cursor?: TaskCursor | null }) {
      const sorted = [...tasks.values()].sort(newestFirst);
      const remaining = cursor ? sorted.filter((task) => newestFirst(cursor, task) < 0) : sorted;
      const items = remaining.slice(0, limit);
      const last = items.at(-1);
      const nextCursor: TaskCursor | null =
        remaining.length > limit && last ? { dataCriacao: last.dataCriacao, id: last.id } : null;
      return { items, nextCursor };
    },

    get(id: string) {
      return tasks.get(id);
    },

    create({ titulo, descricao }: TaskInput) {
      const task: Task = {
        id: crypto.randomUUID(),
        titulo,
        descricao: descricao || undefined,
        dataCriacao: Date.now(),
      };
      tasks.set(task.id, task);
      return task;
    },

    update(id: string, { titulo, descricao }: TaskInput) {
      const current = tasks.get(id);
      if (!current) return undefined;
      const updated: Task = { ...current, titulo, descricao: descricao || undefined };
      tasks.set(id, updated);
      return updated;
    },

    delete(id: string) {
      return tasks.delete(id);
    },
  };
}

export type TaskStore = ReturnType<typeof createTaskStore>;

// Fictional sample data, so the list (and its infinite scroll) has something
// to show on the first run.
const SAMPLE_TASKS: Pick<Task, "titulo" | "descricao">[] = [
  { titulo: "Plan the sprint backlog", descricao: "Pick the stories for the next two weeks with the team." },
  { titulo: "Review the pull request for the login page" },
  { titulo: "Write unit tests for the task router", descricao: "Cover validation errors and pagination." },
  { titulo: "Update project dependencies" },
  { titulo: "Fix the flaky checkout end-to-end test", descricao: "It fails randomly on CI when the network is slow." },
  { titulo: "Draft the release notes for version 1.2" },
  { titulo: "Prepare the demo for Friday's review" },
  { titulo: "Refactor the pagination helper" },
  { titulo: "Document the API endpoints", descricao: "Add request and response examples." },
  { titulo: "Add an empty state to the dashboard" },
  { titulo: "Investigate the slow monthly report query" },
  { titulo: "Remove unused feature flags" },
  { titulo: "Design the onboarding email" },
  { titulo: "Configure the CI dependency cache", descricao: "Builds should take less than five minutes." },
  { titulo: "Answer pending support tickets" },
  { titulo: "Translate the settings page" },
  { titulo: "Organize the team retrospective", descricao: "Book a room and prepare the board." },
  { titulo: "Benchmark the image upload service" },
  { titulo: "Set up error monitoring alerts" },
  { titulo: "Clean up old staging environments" },
  { titulo: "Write the accessibility checklist", descricao: "Keyboard navigation, focus states and color contrast." },
  { titulo: "Pair with the new teammate on the codebase" },
  { titulo: "Create a style guide for the UI components" },
  { titulo: "Archive last quarter's documents" },
];

function createSampleTasks(): Task[] {
  const now = Date.now();
  return SAMPLE_TASKS.map((task, index) => ({
    ...task,
    id: crypto.randomUUID(),
    dataCriacao: now - (index + 1) * 47 * 60 * 1000,
  }));
}

// Next.js can evaluate this module more than once in the same server process
// (separately bundled routes, and again on every hot reload in development).
// Keeping the store on globalThis makes all of them share one in-memory list.
const globalForTasks = globalThis as typeof globalThis & { taskStore?: TaskStore };

export const taskStore = (globalForTasks.taskStore ??= createTaskStore(createSampleTasks()));
