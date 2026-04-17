<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <span class="sidebar__logo" aria-hidden="true" />
      <div>
        <div class="sidebar__title">TaskBoard</div>
        <div class="sidebar__sub">Projects & tasks</div>
      </div>
    </div>
    <nav class="sidebar__nav" aria-label="Main">
      <RouterLink
        class="sidebar__link"
        :class="{ 'sidebar__link--active': route.name === 'projects' }"
        to="/"
      >
        Projects
      </RouterLink>
      <RouterLink
        class="sidebar__link"
        :class="{ 'sidebar__link--active': route.name === 'dashboard' }"
        to="/dashboard"
      >
        Dashboard
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.sidebar {
  width: 240px;
  border-right: 1px solid $border;
  background: $surface;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar__brand {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.sidebar__logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: radial-gradient(circle at 30% 30%, $primary, #7a3c00);
  box-shadow: 0 0 0 1px rgba($primary, 0.35);
}

.sidebar__title {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sidebar__sub {
  font-size: 0.8rem;
  color: $muted;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sidebar__link {
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  color: $muted;
  border: 1px solid transparent;

  &:hover {
    color: $text;
    background: rgba($row-hover, 0.6);
  }

  &:focus-visible {
    @include focus-ring;
  }
}

.sidebar__link--active {
  color: $text;
  border-color: rgba($primary, 0.35);
  background: rgba($primary, 0.12);
  box-shadow: 0 0 0 1px rgba($primary, 0.15);
}
</style>
