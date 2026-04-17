<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps<{
  id: string;
  modelValue: string;
  label?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const selectedLabel = computed(() => {
  const opt = props.options.find((o) => o.value === props.modelValue);
  return opt?.label ?? "";
});

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
}

function choose(value: string) {
  emit("update:modelValue", value);
  open.value = false;
}

function onDocPointerDown(e: MouseEvent) {
  const root = rootRef.value;
  if (!root || !open.value) return;
  if (e.target instanceof Node && !root.contains(e.target)) {
    open.value = false;
  }
}

function onEscape(e: KeyboardEvent) {
  if (e.key === "Escape") open.value = false;
}

watch(open, (isOpen) => {
  if (isOpen) {
    window.addEventListener("keydown", onEscape);
  } else {
    window.removeEventListener("keydown", onEscape);
  }
});

onMounted(() => {
  document.addEventListener("pointerdown", onDocPointerDown, true);
});
onUnmounted(() => {
  document.removeEventListener("pointerdown", onDocPointerDown, true);
  window.removeEventListener("keydown", onEscape);
});
</script>

<template>
  <div ref="rootRef" class="field">
    <label v-if="label" class="field__label" :for="id">{{ label }}</label>
    <div class="field__control">
      <button
        :id="id"
        type="button"
        class="field__trigger"
        :class="{ 'field__trigger--open': open }"
        :disabled="disabled"
        :aria-expanded="open"
        aria-haspopup="listbox"
        :aria-controls="`${id}-listbox`"
        @click="toggle"
      >
        <span class="field__value">{{ selectedLabel }}</span>
        <span class="field__chevron-wrap" aria-hidden="true">
          <svg
            class="field__chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <ul
        v-show="open"
        :id="`${id}-listbox`"
        class="field__list"
        role="listbox"
        :aria-labelledby="id"
      >
        <li
          v-for="opt in options"
          :key="opt.value"
          role="option"
          class="field__option"
          :class="{ 'field__option--selected': modelValue === opt.value }"
          :aria-selected="modelValue === opt.value"
          @click.stop="choose(opt.value)"
        >
          {{ opt.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field__label {
  font-size: 0.85rem;
  color: $muted;
}

.field__control {
  position: relative;
}

.field__trigger {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.55rem 2.75rem 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1px solid $border;
  background: $bg;
  color: $text;
  cursor: pointer;
  text-align: left;
  font: inherit;

  &:focus-visible {
    @include focus-ring;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.field__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field__chevron-wrap {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  margin-top: -9px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: $muted;
}

.field__chevron {
  display: block;
  width: 18px;
  height: 18px;
  transition: transform 0.22s ease;
  transform: rotate(0deg);
}

.field__trigger--open .field__chevron {
  transform: rotate(180deg);
}

.field__list {
  position: absolute;
  z-index: 40;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  margin: 0;
  padding: 0.35rem 0;
  list-style: none;
  max-height: 240px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid $border;
  background: $surface;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.field__option {
  padding: 0.5rem 0.75rem;
  padding-right: 2.75rem;
  cursor: pointer;
  font-size: 0.92rem;

  &:hover,
  &:focus {
    background: $row-hover;
  }
}

.field__option--selected {
  color: $primary;
  font-weight: 600;
}
</style>
