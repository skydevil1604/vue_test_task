<script setup lang="ts">
import { useToast } from "@/shared/composables/use-toast";

const { items } = useToast();
</script>

<template>
  <div class="toasts" aria-live="polite">
    <div
      v-for="t in items"
      :key="t.id"
      class="toast"
      :class="{
        'toast--ok': t.kind === 'success',
        'toast--err': t.kind === 'error',
      }"
    >
      <span class="toast__icon" aria-hidden="true">{{
        t.kind === "success" ? "✓" : "!"
      }}</span>
      <span>{{ t.message }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.toasts {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: min(360px, calc(100vw - 2rem));
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px solid $border;
  background: $surface;
  color: $text;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  font-size: 0.9rem;
}

.toast--ok {
  border-color: rgba($secondary, 0.45);
}

.toast--err {
  border-color: rgba(#f44, 0.55);
}

.toast__icon {
  font-weight: 700;
  color: $secondary;
}

.toast--err .toast__icon {
  color: #f88;
}
</style>
