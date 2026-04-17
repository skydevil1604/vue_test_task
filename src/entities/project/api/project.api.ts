import { api } from "@/shared/api/client";
import * as mock from "@/shared/api/mock-backend";
import { isMockApiEnabled } from "@/shared/api/mock-backend";
import type { CreateProjectDto, Project } from "@/entities/project/model/types";

export async function fetchProjects(): Promise<Project[]> {
  if (isMockApiEnabled()) return mock.mockFetchProjects();
  const { data } = await api.get<Project[]>("/projects");
  return data;
}

export async function fetchProject(id: number): Promise<Project> {
  if (isMockApiEnabled()) return mock.mockFetchProject(id);
  const { data } = await api.get<Project>(`/projects/${id}`);
  return data;
}

export async function createProject(
  payload: CreateProjectDto,
): Promise<Project> {
  if (isMockApiEnabled()) return mock.mockCreateProject(payload);
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
  if (isMockApiEnabled()) return mock.mockUpdateProject(id, partial);
  const { data } = await api.patch<Project>(`/projects/${id}`, partial);
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  if (isMockApiEnabled()) return mock.mockDeleteProject(id);
  await api.delete(`/projects/${id}`);
}
