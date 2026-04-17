<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "primary" | "ghost" | "danger";
    type?: "button" | "submit";
    disabled?: boolean;
  }>(),
  { variant: "primary", type: "button", disabled: false },
);
</script>

<template>
  <button
    :type="props.type"
    class="btn"
    :class="[`btn--${props.variant}`, { 'btn--disabled': props.disabled }]"
    :disabled="props.disabled"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use "sass:color";
@use "@/styles/variables" as *;

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;

  &:focus-visible {
    @include focus-ring;
  }
}

.btn--primary {
  background: $primary;
  color: #0f1115;

  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }

  &:active:not(:disabled) {
    box-shadow: 0 0 0 3px rgba($primary, 0.35);
  }
}

.btn--ghost {
  background: transparent;
  border-color: $border;
  color: $text;

  &:hover:not(:disabled) {
    filter: brightness(1.05);
    border-color: color.adjust($border, $lightness: 6%);
  }
}

.btn--danger {
  background: transparent;
  border-color: #c44;
  color: #f88;

  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }
}

.btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
