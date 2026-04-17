<script setup lang="ts">
import { computed } from "vue";
import type { Task, TaskStatus } from "@/entities/task/model/types";
import { formatDate } from "@/shared/lib/date";

const props = defineProps<{ task: Task }>();

const tone = computed(() => {
  const s: TaskStatus = props.task.status;
  if (s === "todo") return "todo";
  if (s === "in_progress") return "progress";
  return "done";
});
</script>

<template>
  <article class="card" :class="`card--${tone}`">
    <h3 class="card__title">{{ task.title }}</h3>
    <p v-if="task.assignee" class="card__meta">{{ task.assignee }}</p>
    <span v-if="task.dueDate" class="badge">{{
      formatDate(task.dueDate)
    }}</span>
  </article>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.card {
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  border: 1px solid $border;
  background: $bg;
}

.card--todo {
  border-left: 3px solid $muted;
}

.card--progress {
  border-left: 3px solid $secondary;
  background: rgba($secondary, 0.06);
}

.card--done {
  border-left: 3px solid #3ecf8e;
  background: rgba(#3ecf8e, 0.06);
}

.card__title {
  margin: 0 0 0.35rem;
  font-size: 0.92rem;
  font-weight: 600;
}

.card__meta {
  margin: 0 0 0.35rem;
  font-size: 0.78rem;
  color: $muted;
}

.badge {
  display: inline-block;
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  border: 1px solid $border;
  color: $muted;
}
</style>
