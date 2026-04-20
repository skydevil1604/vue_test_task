<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Button from "@/shared/ui/button/button.vue";
import TasksTable from "@/widgets/tasks-table/tasks-table.vue";
import KanbanBoard from "@/widgets/kanban-board/kanban-board.vue";
import TaskCreateModal from "@/features/task-create/task-create-modal.vue";
import { useProjectsStore } from "@/entities/project/model/store";
import { useTasksStore } from "@/entities/task/model/store";
import { loadJson, saveJson } from "@/shared/lib/storage";
import * as projectApi from "@/entities/project/api/project.api";

const props = defineProps<{ id: string }>();

const router = useRouter();
const projects = useProjectsStore();
const tasks = useTasksStore();

const projectId = computed(() => Number(props.id));

const viewMode = ref<"table" | "kanban">("table");
const taskModalOpen = ref(false);
const notFound = ref(false);

watch(
  () => projectId.value,
  (id) => {
    const v = loadJson<string | null>(`ui:viewMode:${id}`, null);
    viewMode.value = v === "kanban" ? "kanban" : "table";
  },
  { immediate: true },
);

watch([viewMode, projectId], () => {
  saveJson(`ui:viewMode:${projectId.value}`, viewMode.value);
});

const project = computed(() => projects.findById(projectId.value));

onMounted(async () => {
  notFound.value = false;
  let p = projects.findById(projectId.value);
  if (!p) {
    await projects.load();
    p = projects.findById(projectId.value);
  }
  if (!p) {
    try {
      const fetched = await projectApi.fetchProject(projectId.value);
      if (!projects.projects.find((x) => x.id === fetched.id)) {
        projects.projects.push(fetched);
      }
    } catch {
      notFound.value = true;
      return;
    }
  }
  await tasks.loadForProject(projectId.value);
});

function back() {
  router.push({ name: "projects" });
}
</script>

<template>
  <div v-if="notFound" class="page">
    <p class="muted">Project not found.</p>
    <Button type="button" variant="ghost" @click="back">← Back</Button>
  </div>

  <div v-else class="page">
    <header class="head">
      <div class="head__row">
        <Button type="button" variant="ghost" @click="back">← Back</Button>
        <div class="head__text">
          <h1 class="title">{{ project?.name ?? "…" }}</h1>
          <p v-if="project?.description" class="desc">
            {{ project.description }}
          </p>
        </div>
      </div>

      <div class="toggle" role="tablist" aria-label="View mode">
        <button
          type="button"
          class="toggle__btn"
          :class="{ 'toggle__btn--on': viewMode === 'table' }"
          role="tab"
          :aria-selected="viewMode === 'table'"
          @click="viewMode = 'table'"
        >
          Table
        </button>
        <button
          type="button"
          class="toggle__btn"
          :class="{ 'toggle__btn--on': viewMode === 'kanban' }"
          role="tab"
          :aria-selected="viewMode === 'kanban'"
          @click="viewMode = 'kanban'"
        >
          Kanban
        </button>
      </div>
    </header>

    <div class="actions">
      <Button type="button" @click="taskModalOpen = true">+ Add task</Button>
    </div>

    <section v-if="tasks.loading" class="muted" aria-busy="true">
      Loading tasks…
    </section>

    <section v-else-if="tasks.byProject(projectId).length === 0" class="empty">
      <p class="empty__title">No tasks yet</p>
      <Button type="button" @click="taskModalOpen = true"
        >Create first task</Button
      >
    </section>

    <TasksTable v-else-if="viewMode === 'table'" :project-id="projectId" />
    <KanbanBoard v-else :project-id="projectId" />

    <TaskCreateModal
      v-model:open="taskModalOpen"
      :project-id="projectId"
      @created="tasks.loadForProject(projectId)"
    />
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.page {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.head__row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.head__text {
  flex: 1;
  min-width: 0;
}

.title {
  margin: 0;
  font-size: 1.35rem;
}

.desc {
  margin: 0.35rem 0 0;
  color: $muted;
  font-size: 0.95rem;
}

.toggle {
  display: inline-flex;
  gap: 0;
  border: 1px solid $border;
  border-radius: 10px;
  overflow: hidden;
  width: fit-content;
}

.toggle__btn {
  border: 0;
  background: transparent;
  color: $muted;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;

  &:hover {
    color: $text;
    background: rgba($row-hover, 0.5);
  }

  &:focus-visible {
    @include focus-ring;
  }
}

.toggle__btn--on {
  color: $text;
  border-bottom-color: $primary;
  background: rgba($primary, 0.08);
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.muted {
  color: $muted;
}

.empty {
  border: 1px dashed $border;
  border-radius: 12px;
  padding: 2rem 1rem;
  text-align: center;
  background: rgba($surface, 0.5);
}

.empty__title {
  margin: 0 0 1rem;
  color: $muted;
}
</style>
