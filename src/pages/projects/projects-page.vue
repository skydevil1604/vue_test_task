<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Button from "@/shared/ui/button/button.vue";
import Input from "@/shared/ui/input/input.vue";
import Select from "@/shared/ui/select/select.vue";
import ProjectCreateModal from "@/features/project-create/project-create-modal.vue";
import ProjectsTable from "@/widgets/projects-table/projects-table.vue";
import { useProjectsStore } from "@/entities/project/model/store";
import { useTasksStore } from "@/entities/task/model/store";
import { debounce } from "@/shared/lib/debounce";

const projects = useProjectsStore();
const tasks = useTasksStore();

const search = ref("");
const searchDebounced = ref("");
const status = ref<"all" | "active" | "completed">("all");
const modalOpen = ref(false);

const updateDebounced = debounce((v: string) => {
  searchDebounced.value = v;
}, 300);

watch(search, (v) => updateDebounced(v));

const rows = computed(() => {
  let list = projects.projects.map((p) => ({
    ...p,
    tasksCount: tasks.tasksCountForProject(p.id),
  }));

  const q = searchDebounced.value.trim().toLowerCase();
  if (q) {
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (status.value !== "all") {
    list = list.filter((p) => p.status === status.value);
  }
  return list;
});

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];
</script>

<template>
  <div class="page">
    <header class="page__head">
      <div>
        <h1 class="page__title">Projects</h1>
        <p class="page__sub">Manage your projects and tasks</p>
      </div>
    </header>

    <section class="toolbar" aria-label="Projects filters">
      <Input
        id="proj-search"
        v-model="search"
        class="toolbar__search"
        placeholder="Search by name…"
        label="Search"
      />
      <Select
        id="proj-status"
        v-model="status"
        label="Status"
        :options="statusOptions"
      />
      <Button type="button" class="toolbar__add" @click="modalOpen = true">
        + Add project
      </Button>
    </section>

    <ProjectsTable :rows="rows" :loading="projects.loading" />

    <ProjectCreateModal v-model:open="modalOpen" @created="projects.load()" />
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

.page__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.page__title {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.02em;
}

.page__sub {
  margin: 0.25rem 0 0;
  color: $muted;
  font-size: 0.95rem;
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr minmax(180px, 220px) auto;
  gap: 0.75rem;
  align-items: end;
}

@media (max-width: 900px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}

.toolbar__search :deep(.field__label) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.toolbar__add {
  white-space: nowrap;
}
</style>
