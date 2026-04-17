export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: number;
  projectId: number;
  title: string;
  assignee?: string;
  status: TaskStatus;
  order: number;
  dueDate?: string;
}

export type TaskOrderUpdate = {
  id: number;
  order: number;
  status: TaskStatus;
};

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

export const ASSIGNEES = ["Alice", "Bob", "Carol", "Dan", "Eve"] as const;
