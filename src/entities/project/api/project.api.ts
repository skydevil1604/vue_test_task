import { api } from "@/shared/api/client";
import type { CreateProjectDto, Project } from "@/entities/project/model/types";

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>("/projects");
  return data;
}

export async function fetchProject(id: number): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${id}`);
  return data;
}

export async function createProject(
  payload: CreateProjectDto,
): Promise<Project> {
  const { data } = await api.post<Project>("/projects", {
    ...payload,
    createdAt: new Date().toISOString(),
  });
  return data;
}

export async function updateProject(
  id: number,
  partial: Partial<Project>,
): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${id}`, partial);
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/projects/${id}`);
}
