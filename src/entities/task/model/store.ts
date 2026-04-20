import { defineStore } from "pinia";
import * as taskApi from "@/entities/task/api/task.api";
import {
  TASK_STATUSES,
  type Task,
  type TaskOrderUpdate,
  type TaskStatus,
} from "@/entities/task/model/types";

function cloneTasks(tasks: Task[]): Task[] {
  return tasks.map((t) => ({ ...t }));
}

const statusRank: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  done: 2,
};

export const useTasksStore = defineStore("tasks", {
  state: () => ({
    tasks: [] as Task[],
    loading: false,
  }),

  getters: {
    byProject:
      (state) =>
      (projectId: number): Task[] => {
        return state.tasks.filter((t) => t.projectId === projectId);
      },

    sortedForTable:
      (state) =>
      (projectId: number): Task[] => {
        return state.tasks
          .filter((t) => t.projectId === projectId)
          .slice()
          .sort((a, b) => {
            const sr = statusRank[a.status] - statusRank[b.status];
            if (sr !== 0) return sr;
            return a.order - b.order;
          });
      },

    byStatus:
      (state) =>
      (projectId: number, status: TaskStatus): Task[] => {
        return state.tasks
          .filter((t) => t.projectId === projectId && t.status === status)
          .slice()
          .sort((a, b) => a.order - b.order);
      },
  },

  actions: {
    async load(): Promise<void> {
      this.loading = true;
      try {
        this.tasks = await taskApi.fetchTasks();
      } finally {
        this.loading = false;
      }
    },

    async loadForProject(projectId: number): Promise<void> {
      this.loading = true;
      try {
        const list = await taskApi.fetchTasksByProject(projectId);
        const others = this.tasks.filter((t) => t.projectId !== projectId);
        this.tasks = [...others, ...list];
      } finally {
        this.loading = false;
      }
    },

    /** Single entry point for Kanban / cross-column moves */
    moveTask(payload: {
      taskId: number;
      toStatus: TaskStatus;
      toIndex: number;
    }): TaskOrderUpdate[] {
      const task = this.tasks.find((t) => t.id === payload.taskId);
      if (!task) return [];

      const projectId = task.projectId;
      const fromStatus = task.status;
      const { toStatus, toIndex } = payload;

      const idsFor = (s: TaskStatus): number[] =>
        this.tasks
          .filter((t) => t.projectId === projectId && t.status === s)
          .sort((a, b) => a.order - b.order)
          .map((t) => t.id);

      const lists: Record<TaskStatus, number[]> = {
        todo: idsFor("todo"),
        in_progress: idsFor("in_progress"),
        done: idsFor("done"),
      };

      lists[fromStatus] = lists[fromStatus].filter(
        (id) => id !== payload.taskId,
      );

      let targetList: number[];
      if (fromStatus === toStatus) {
        targetList = lists[toStatus];
      } else {
        targetList = lists[toStatus].filter((id) => id !== payload.taskId);
      }

      const next = [...targetList];
      const idx = Math.max(0, Math.min(toIndex, next.length));
      next.splice(idx, 0, payload.taskId);
      lists[toStatus] = next;

      const updates: TaskOrderUpdate[] = [];
      for (const s of TASK_STATUSES) {
        lists[s].forEach((id, order) => {
          const t = this.tasks.find((x) => x.id === id);
          if (!t) return;
          if (t.order !== order || t.status !== s) {
            t.order = order;
            t.status = s;
            updates.push({ id: t.id, order, status: s });
          }
        });
      }
      return updates;
    },

    /**
     * Table row reorder: `orderedIds` is the new flat order (full project list).
     * Status unchanged; `order` is reassigned per status by appearance in list.
     */
    reorderFromFlatOrder(
      projectId: number,
      orderedIds: number[],
    ): TaskOrderUpdate[] {
      const updates: TaskOrderUpdate[] = [];
      const buckets: Record<TaskStatus, number[]> = {
        todo: [],
        in_progress: [],
        done: [],
      };

      for (const id of orderedIds) {
        const t = this.tasks.find(
          (x) => x.id === id && x.projectId === projectId,
        );
        if (!t) continue;
        buckets[t.status].push(id);
      }

      for (const s of TASK_STATUSES) {
        buckets[s].forEach((id, order) => {
          const t = this.tasks.find((x) => x.id === id);
          if (!t) return;
          if (t.order !== order || t.status !== s) {
            t.order = order;
            t.status = s;
            updates.push({ id, order, status: s });
          }
        });
      }
      return updates;
    },

    replaceTasksSnapshot(snapshot: Task[]): void {
      this.tasks = cloneTasks(snapshot);
    },

    /**
     * After Kanban drag; `cols` lists contain Task refs in visual order per column.
     */
    applyKanbanBoard(
      projectId: number,
      cols: Record<TaskStatus, Task[]>,
    ): TaskOrderUpdate[] {
      const updates: TaskOrderUpdate[] = [];
      for (const s of TASK_STATUSES) {
        cols[s].forEach((task, order) => {
          const t = this.tasks.find((x) => x.id === task.id);
          if (!t || t.projectId !== projectId) return;
          if (t.status !== s || t.order !== order) {
            t.status = s;
            t.order = order;
            updates.push({ id: t.id, order, status: s });
          }
        });
      }
      return updates;
    },

    async runOrderMutation(mutate: () => TaskOrderUpdate[]): Promise<void> {
      const before = cloneTasks(this.tasks);
      const updates = mutate();
      if (updates.length === 0) return;
      try {
        await taskApi.updateTasksOrder(updates);
      } catch {
        this.replaceTasksSnapshot(before);
        throw new Error("persistOrder");
      }
    },

    async createTask(payload: Omit<Task, "id">): Promise<Task> {
      const created = await taskApi.createTask(payload);
      this.tasks.push(created);
      return created;
    },

    async updateTask(id: number, partial: Partial<Task>): Promise<Task> {
      const updated = await taskApi.updateTask(id, partial);
      const i = this.tasks.findIndex((t) => t.id === id);
      if (i >= 0) this.tasks[i] = updated;
      return updated;
    },

    async deleteTask(id: number): Promise<void> {
      await taskApi.deleteTask(id);
      this.tasks = this.tasks.filter((t) => t.id !== id);
    },

    nextId(): number {
      return this.tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1;
    },

    tasksCountForProject(projectId: number): number {
      return this.tasks.filter((t) => t.projectId === projectId).length;
    },
  },
});
