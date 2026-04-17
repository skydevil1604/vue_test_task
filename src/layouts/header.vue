<template>
  <header class="header">
    <div class="header__right">
      <span class="header__pill" title="Dark theme">Dark</span>
      <div class="header__avatar" aria-hidden="true" />
    </div>
  </header>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid $border;
  background: rgba($surface, 0.65);
  backdrop-filter: blur(8px);
}

.header__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header__pill {
  font-size: 0.75rem;
  color: $muted;
  border: 1px solid $border;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
}

.header__avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: linear-gradient(135deg, $primary, $secondary);
  opacity: 0.85;
}
</style>
