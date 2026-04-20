import type { CreateProjectDto, Project } from "@/entities/project/model/types";
import type { Task, TaskOrderUpdate } from "@/entities/task/model/types";
import seed from "@/data/db-seed.json";

type Db = { projects: Project[]; tasks: Task[] };

const LS_KEY = "ptm-mock-db-v1";

let memory: Db | null = null;

function readLs(): Db | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Db;
  } catch {
    return null;
  }
}

function writeLs(db: Db): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  } catch {
    /* quota */
  }
}

function getDb(): Db {
  if (memory) return memory;
  const fromLs = readLs();
  if (fromLs) {
    memory = fromLs;
    return memory;
  }
  const s = seed as { projects: Project[]; tasks: Task[] };
  memory = {
    projects: s.projects.map((p) => ({ ...p })),
    tasks: s.tasks.map((t) => ({ ...t })),
  };
  writeLs(memory);
  return memory;
}

function persist(): void {
  if (memory) writeLs(memory);
}

function nextProjectId(db: Db): number {
  return db.projects.reduce((m, p) => Math.max(m, p.id), 0) + 1;
}

function nextTaskId(db: Db): number {
  return db.tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1;
}

export async function mockFetchProjects(): Promise<Project[]> {
  return [...getDb().projects];
}

export async function mockFetchProject(id: number): Promise<Project> {
  const p = getDb().projects.find((x) => x.id === id);
  if (!p) throw new Error("Project not found");
  return { ...p };
}

export async function mockCreateProject(
  payload: CreateProjectDto,
): Promise<Project> {
  const db = getDb();
  const row: Project = {
    id: nextProjectId(db),
    name: payload.name,
    description: payload.description,
    status: payload.status ?? "active",
    createdAt: new Date().toISOString(),
  };
  db.projects.push(row);
  persist();
  return { ...row };
}

export async function mockUpdateProject(
  id: number,
  partial: Partial<Project>,
): Promise<Project> {
  const db = getDb();
  const i = db.projects.findIndex((p) => p.id === id);
  if (i < 0) throw new Error("Project not found");
  db.projects[i] = { ...db.projects[i], ...partial };
  persist();
  return { ...db.projects[i] };
}

export async function mockDeleteProject(id: number): Promise<void> {
  const db = getDb();
  db.projects = db.projects.filter((p) => p.id !== id);
  db.tasks = db.tasks.filter((t) => t.projectId !== id);
  persist();
}

export async function mockFetchTasks(): Promise<Task[]> {
  return [...getDb().tasks];
}

export async function mockFetchTasksByProject(
  projectId: number,
): Promise<Task[]> {
  return getDb().tasks.filter((t) => t.projectId === projectId);
}

export async function mockCreateTask(payload: Omit<Task, "id">): Promise<Task> {
  const db = getDb();
  const row: Task = {
    ...payload,
    id: nextTaskId(db),
  };
  db.tasks.push(row);
  persist();
  return { ...row };
}

export async function mockUpdateTask(
  id: number,
  partial: Partial<Task>,
): Promise<Task> {
  const db = getDb();
  const i = db.tasks.findIndex((t) => t.id === id);
  if (i < 0) throw new Error("Task not found");
  db.tasks[i] = { ...db.tasks[i], ...partial };
  persist();
  return { ...db.tasks[i] };
}

export async function mockDeleteTask(id: number): Promise<void> {
  const db = getDb();
  db.tasks = db.tasks.filter((t) => t.id !== id);
  persist();
}

export async function mockUpdateTasksOrder(
  updates: TaskOrderUpdate[],
): Promise<void> {
  if (updates.length === 0) return;
  const db = getDb();
  const byId = new Map(db.tasks.map((t) => [t.id, { ...t }]));
  for (const u of updates) {
    const cur = byId.get(u.id);
    if (!cur) continue;
    cur.order = u.order;
    cur.status = u.status;
  }
  db.tasks = db.tasks.map((t) => {
    const m = byId.get(t.id);
    return m ?? t;
  });
  persist();
}
