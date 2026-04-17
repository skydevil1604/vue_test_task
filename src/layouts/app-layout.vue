<script setup lang="ts">
import { onMounted } from "vue";
import Header from "@/layouts/header.vue";
import Sidebar from "@/layouts/sidebar.vue";
import ToastHost from "@/shared/ui/toast-host/toast-host.vue";
import { useProjectsStore } from "@/entities/project/model/store";
import { useTasksStore } from "@/entities/task/model/store";

const projects = useProjectsStore();
const tasks = useTasksStore();

onMounted(async () => {
  await Promise.all([projects.load(), tasks.load()]);
});
</script>

<template>
  <div class="layout">
    <Sidebar />
    <div class="layout__col">
      <Header />
      <main class="layout__main">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
    <ToastHost />
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.layout {
  min-height: 100%;
  display: flex;
  background: $bg;
}

.layout__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.layout__main {
  flex: 1;
  padding: 1.25rem;
  min-height: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
