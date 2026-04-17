<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

const props = defineProps<{
  title: string;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="modal"
      role="dialog"
      aria-modal="true"
      :aria-label="props.title"
    >
      <div class="modal__backdrop" @click.self="emit('close')" />
      <div class="modal__panel">
        <header class="modal__header">
          <h2 class="modal__title">{{ props.title }}</h2>
          <button
            type="button"
            class="modal__close"
            aria-label="Close"
            @click="emit('close')"
          >
            ×
          </button>
        </header>
        <div class="modal__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.modal__panel {
  position: relative;
  width: min(520px, 100%);
  background: $surface;
  border: 1px solid $border;
  border-radius: 12px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.5rem;
  border-bottom: 1px solid $border;
}

.modal__title {
  margin: 0;
  font-size: 1.1rem;
}

.modal__close {
  border: 1px solid transparent;
  background: transparent;
  color: $muted;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 8px;
  padding: 0.15rem 0.45rem;

  &:hover {
    color: $text;
    border-color: $border;
  }

  &:focus-visible {
    @include focus-ring;
  }
}

.modal__body {
  padding: 1rem;
}

.modal__footer {
  padding: 0 1rem 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
