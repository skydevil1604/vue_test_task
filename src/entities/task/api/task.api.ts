import { api } from "@/shared/api/client";
import type {
  Task,
  TaskOrderUpdate,
  TaskStatus,
} from "@/entities/task/model/types";

export async function fetchTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/tasks");
  return data;
}

export async function fetchTasksByProject(projectId: number): Promise<Task[]> {
  const { data } = await api.get<Task[]>(
    `/tasks?projectId=${encodeURIComponent(String(projectId))}`,
  );
  return data;
}

export async function createTask(payload: Omit<Task, "id">): Promise<Task> {
  const { data } = await api.post<Task>("/tasks", payload);
  return data;
}

export async function updateTask(
  id: number,
  partial: Partial<Task>,
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, partial);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function updateTasksOrder(
  updates: TaskOrderUpdate[],
): Promise<void> {
  if (updates.length === 0) return;
  await api.post("/tasks/batch-order", { updates });
}

export type CreateTaskPayload = {
  projectId: number;
  title: string;
  assignee?: string;
  status: TaskStatus;
  dueDate?: string;
};
