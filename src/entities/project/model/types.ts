export type ProjectStatus = "active" | "completed";

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
}

export type CreateProjectDto = {
  name: string;
  description?: string;
  status?: ProjectStatus;
};
