<script setup lang="ts">
import { onMounted, reactive, watch } from "vue";
import draggable from "vuedraggable";
import {
  TASK_STATUSES,
  type Task,
  type TaskStatus,
} from "@/entities/task/model/types";
import { useTasksStore } from "@/entities/task/model/store";
import { useToast } from "@/shared/composables/use-toast";
import TaskCard from "@/widgets/kanban-board/task-card.vue";

const props = defineProps<{ projectId: number }>();

const tasks = useTasksStore();
const toast = useToast();

const cols = reactive<Record<TaskStatus, Task[]>>({
  todo: [],
  in_progress: [],
  done: [],
});

function hydrate() {
  for (const s of TASK_STATUSES) {
    cols[s] = tasks.byStatus(props.projectId, s);
  }
}

onMounted(hydrate);
watch(
  () => [props.projectId, tasks.tasks],
  () => {
    hydrate();
  },
  { deep: true },
);

const group = { name: "tasks", pull: true, put: true };

async function onEnd() {
  try {
    await tasks.runOrderMutation(() =>
      tasks.applyKanbanBoard(props.projectId, cols),
    );
  } catch {
    toast.push("Could not save board order", "error");
    hydrate();
  }
}

const titles: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};
</script>

<template>
  <div class="board">
    <section
      v-for="s in TASK_STATUSES"
      :key="s"
      class="column"
      :data-status="s"
    >
      <header class="column__head">
        <h2 class="column__title">{{ titles[s] }}</h2>
        <span class="column__count">{{ cols[s].length }}</span>
      </header>
      <draggable
        :list="cols[s]"
        class="column__list"
        :group="group"
        item-key="id"
        :animation="180"
        ghost-class="ghost"
        drag-class="drag"
        chosen-class="chosen"
        @end="onEnd"
      >
        <template #item="{ element }">
          <TaskCard :task="element" class="column__card" />
        </template>
      </draggable>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  align-items: start;
}

@media (max-width: 960px) {
  .board {
    grid-template-columns: 1fr;
  }
}

.column {
  border: 1px solid $border;
  border-radius: 12px;
  background: rgba($surface, 0.85);
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.column__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid $border;
}

.column__title {
  margin: 0;
  font-size: 0.95rem;
}

.column__count {
  font-size: 0.8rem;
  color: $muted;
}

.column__list {
  padding: 0.5rem;
  flex: 1;
  min-height: 120px;
}

.column__card {
  margin-bottom: 0.5rem;
}

:deep(.ghost) {
  opacity: 0.45;
}

:deep(.drag) {
  transform: scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

:deep(.chosen) {
  filter: brightness(1.06);
}
</style>
