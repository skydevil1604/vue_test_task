import { api } from "@/shared/api/client";
import * as mock from "@/shared/api/mock-backend";
import { isMockApiEnabled } from "@/shared/api/mock-backend";
import type {
  Task,
  TaskOrderUpdate,
  TaskStatus,
} from "@/entities/task/model/types";

export async function fetchTasks(): Promise<Task[]> {
  if (isMockApiEnabled()) return mock.mockFetchTasks();
  const { data } = await api.get<Task[]>("/tasks");
  return data;
}

export async function fetchTasksByProject(projectId: number): Promise<Task[]> {
  if (isMockApiEnabled()) return mock.mockFetchTasksByProject(projectId);
  const { data } = await api.get<Task[]>(
    `/tasks?projectId=${encodeURIComponent(String(projectId))}`,
  );
  return data;
}

export async function createTask(
  payload: Omit<Task, "id">,
): Promise<Task> {
  if (isMockApiEnabled()) return mock.mockCreateTask(payload);
  const { data } = await api.post<Task>("/tasks", payload);
  return data;
}

export async function updateTask(
  id: number,
  partial: Partial<Task>,
): Promise<Task> {
  if (isMockApiEnabled()) return mock.mockUpdateTask(id, partial);
  const { data } = await api.patch<Task>(`/tasks/${id}`, partial);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  if (isMockApiEnabled()) return mock.mockDeleteTask(id);
  await api.delete(`/tasks/${id}`);
}

export async function updateTasksOrder(
  updates: TaskOrderUpdate[],
): Promise<void> {
  if (isMockApiEnabled()) return mock.mockUpdateTasksOrder(updates);
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
