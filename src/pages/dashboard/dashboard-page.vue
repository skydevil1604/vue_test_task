<script setup lang="ts">
import { computed } from "vue";
import { useTasksStore } from "@/entities/task/model/store";
import { useProjectsStore } from "@/entities/project/model/store";
import type { TaskStatus } from "@/entities/task/model/types";

const tasks = useTasksStore();
const projects = useProjectsStore();

const counts = computed(() => {
  const c: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
  };
  for (const t of tasks.tasks) {
    c[t.status] += 1;
  }
  return c;
});

const total = computed(() => tasks.tasks.length);

const segments = computed(() => {
  const order: TaskStatus[] = ["todo", "in_progress", "done"];
  const colors: Record<TaskStatus, string> = {
    todo: "#9aa4b2",
    in_progress: "#1fb6a6",
    done: "#3ecf8e",
  };
  const labels: Record<TaskStatus, string> = {
    todo: "To do",
    in_progress: "In progress",
    done: "Done",
  };
  return order.map((s) => ({
    status: s,
    label: labels[s],
    value: counts.value[s],
    color: colors[s],
  }));
});

const pieStyle = computed(() => {
  const t = total.value;
  if (!t) return { background: "transparent" };
  let acc = 0;
  const parts: string[] = [];
  for (const seg of segments.value) {
    const deg = (seg.value / t) * 360;
    const a = acc;
    acc += deg;
    parts.push(`${seg.color} ${a}deg ${acc}deg`);
  }
  return {
    background: `conic-gradient(${parts.join(", ")})`,
  };
});
</script>

<template>
  <div class="dash">
    <header class="head">
      <h1 class="title">Dashboard</h1>
      <p class="sub">Overview across all projects</p>
    </header>

    <div class="grid">
      <section class="card">
        <h2 class="card__title">Projects</h2>
        <p class="card__metric">{{ projects.projects.length }}</p>
        <p class="card__hint">Total projects</p>
      </section>
      <section class="card">
        <h2 class="card__title">Tasks</h2>
        <p class="card__metric">{{ total }}</p>
        <p class="card__hint">All tasks</p>
      </section>
    </div>

    <section class="chart card">
      <h2 class="card__title">Tasks by status</h2>
      <div v-if="total === 0" class="muted">No tasks to chart yet.</div>
      <div v-else class="chart__body">
        <div
          class="pie"
          role="img"
          aria-label="Tasks distribution pie chart"
          :style="pieStyle"
        />
        <ul class="legend">
          <li v-for="seg in segments" :key="seg.status">
            <span class="dot" :style="{ background: seg.color }" />
            {{ seg.label }} — {{ seg.value }}
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.dash {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.head {
  margin-bottom: 0.25rem;
}

.title {
  margin: 0;
  font-size: 1.5rem;
}

.sub {
  margin: 0.35rem 0 0;
  color: $muted;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.card {
  border: 1px solid $border;
  border-radius: 12px;
  padding: 1rem;
  background: $surface;
}

.card__title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: $muted;
}

.card__metric {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.card__hint {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: $muted;
}

.chart__body {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
}

.pie {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 1px solid $border;
}

.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.92rem;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-right: 0.5rem;
}

.muted {
  color: $muted;
}
</style>
