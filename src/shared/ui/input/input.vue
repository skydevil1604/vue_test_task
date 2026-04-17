<script setup lang="ts">
defineProps<{
  id: string;
  modelValue: string;
  label?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="field">
    <label v-if="label" class="field__label" :for="id">{{ label }}</label>
    <input
      :id="id"
      class="field__input"
      :class="{ 'field__input--error': error }"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="modelValue"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    />
    <p v-if="error" class="field__error" role="alert">{{ error }}</p>
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

.field__input {
  padding: 0.55rem 1rem 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1px solid $border;
  background: $bg;
  color: $text;

  &:focus-visible {
    @include focus-ring;
  }

  &:disabled {
    opacity: 0.5;
  }
}

.field__input--error {
  border-color: #c44;
}

.field__error {
  margin: 0;
  font-size: 0.8rem;
  color: #f88;
}
</style>
