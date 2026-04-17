import { defineStore } from "pinia";
import * as projectApi from "@/entities/project/api/project.api";
import type { CreateProjectDto, Project } from "@/entities/project/model/types";

export const useProjectsStore = defineStore("projects", {
  state: () => ({
    projects: [] as Project[],
    loading: false,
  }),

  getters: {
    findById: (state) => {
      return (id: number): Project | undefined =>
        state.projects.find((p) => p.id === id);
    },
  },

  actions: {
    async load(): Promise<void> {
      this.loading = true;
      try {
        this.projects = await projectApi.fetchProjects();
      } finally {
        this.loading = false;
      }
    },

    async create(dto: CreateProjectDto): Promise<Project> {
      const created = await projectApi.createProject({
        ...dto,
        status: dto.status ?? "active",
      });
      this.projects.push(created);
      return created;
    },

    async update(id: number, partial: Partial<Project>): Promise<Project> {
      const updated = await projectApi.updateProject(id, partial);
      const i = this.projects.findIndex((p) => p.id === id);
      if (i >= 0) this.projects[i] = updated;
      return updated;
    },

    async remove(id: number): Promise<void> {
      await projectApi.deleteProject(id);
      this.projects = this.projects.filter((p) => p.id !== id);
    },
  },
});
