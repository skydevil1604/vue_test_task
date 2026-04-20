<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  FlexRender,
  createColumnHelper,
  functionalUpdate,
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnSizingState,
  type SortingState,
} from "@tanstack/vue-table";
import draggable from "vuedraggable";
import type { Task, TaskStatus } from "@/entities/task/model/types";
import { useTasksStore } from "@/entities/task/model/store";
import { useToast } from "@/shared/composables/use-toast";
import { debounce } from "@/shared/lib/debounce";
import { formatDate } from "@/shared/lib/date";
import { loadJson, saveJson } from "@/shared/lib/storage";

const props = defineProps<{ projectId: number }>();

const tasks = useTasksStore();
const toast = useToast();

type TaskFieldFilters = {
  titleContains: string;
  assigneeContains: string;
  statusTodo: boolean;
  statusInProgress: boolean;
  statusDone: boolean;
  dueFrom: string;
  dueTo: string;
};

function defaultFieldFilters(): TaskFieldFilters {
  return {
    titleContains: "",
    assigneeContains: "",
    statusTodo: true,
    statusInProgress: true,
    statusDone: true,
    dueFrom: "",
    dueTo: "",
  };
}

const search = ref("");
const searchDebounced = ref("");
const debouncedSet = debounce((v: string) => {
  searchDebounced.value = v;
}, 300);
watch(search, (v) => debouncedSet(v));

const filters = ref<TaskFieldFilters>(defaultFieldFilters());
const filterPanelOpen = ref(false);
const toolbarRef = ref<HTMLElement | null>(null);

function loadFiltersForProject(id: number) {
  const stored = loadJson<Partial<TaskFieldFilters> | null>(
    `ui:tasksFilters:${id}`,
    null,
  );
  filters.value = {
    ...defaultFieldFilters(),
    ...(stored ?? {}),
  };
}

watch(
  () => props.projectId,
  (id) => {
    loadFiltersForProject(id);
  },
  { immediate: true },
);

const persistFilters = debounce(() => {
  saveJson(`ui:tasksFilters:${props.projectId}`, filters.value);
}, 300);

watch(filters, persistFilters, { deep: true });

function resetFieldFilters() {
  filters.value = defaultFieldFilters();
}

function closeFilterPanel() {
  filterPanelOpen.value = false;
}

function onDocPointerDown(e: MouseEvent) {
  const root = toolbarRef.value;
  if (!root || !filterPanelOpen.value) return;
  if (e.target instanceof Node && !root.contains(e.target)) {
    filterPanelOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocPointerDown, true);
});
onUnmounted(() => {
  document.removeEventListener("pointerdown", onDocPointerDown, true);
});

const sorting = ref<SortingState>([]);
const columnSizing = ref<ColumnSizingState>({});

watch(
  () => props.projectId,
  (id) => {
    const s = loadJson<{
      sorting: SortingState;
      columnSizing: ColumnSizingState;
    }>(`ui:tasksTable:${id}`, { sorting: [], columnSizing: {} });
    sorting.value = s.sorting;
    columnSizing.value = s.columnSizing;
  },
  { immediate: true },
);

const persistTable = debounce(() => {
  saveJson(`ui:tasksTable:${props.projectId}`, {
    sorting: sorting.value,
    columnSizing: columnSizing.value,
  });
}, 300);

watch([sorting, columnSizing], persistTable, { deep: true });

function statusAllowed(t: Task, f: TaskFieldFilters): boolean {
  const anyChecked = f.statusTodo || f.statusInProgress || f.statusDone;
  if (!anyChecked) return false;
  if (t.status === "todo") return f.statusTodo;
  if (t.status === "in_progress") return f.statusInProgress;
  return f.statusDone;
}

function applyAdvancedFilters(list: Task[], f: TaskFieldFilters): Task[] {
  return list.filter((t) => {
    if (f.titleContains.trim()) {
      const q = f.titleContains.trim().toLowerCase();
      if (!t.title.toLowerCase().includes(q)) return false;
    }
    if (f.assigneeContains.trim()) {
      const a = (t.assignee ?? "").toLowerCase();
      if (!a.includes(f.assigneeContains.trim().toLowerCase())) return false;
    }
    if (!statusAllowed(t, f)) return false;
    if (f.dueFrom) {
      if (!t.dueDate || t.dueDate < f.dueFrom) return false;
    }
    if (f.dueTo) {
      if (!t.dueDate || t.dueDate > f.dueTo) return false;
    }
    return true;
  });
}

const hasAdvancedFilter = computed(() => {
  const f = filters.value;
  const def = defaultFieldFilters();
  return (
    f.titleContains !== def.titleContains ||
    f.assigneeContains !== def.assigneeContains ||
    f.dueFrom !== def.dueFrom ||
    f.dueTo !== def.dueTo ||
    f.statusTodo !== def.statusTodo ||
    f.statusInProgress !== def.statusInProgress ||
    f.statusDone !== def.statusDone
  );
});

const hasFilter = computed(
  () => searchDebounced.value.trim().length > 0 || hasAdvancedFilter.value,
);

const hasSort = computed(() => sorting.value.length > 0);

const canDnd = computed(() => !hasFilter.value && !hasSort.value);

const dndList = ref<Task[]>([]);

watch(
  () => [props.projectId, tasks.tasks, canDnd.value] as const,
  () => {
    if (canDnd.value) {
      dndList.value = [...tasks.sortedForTable(props.projectId)];
    }
  },
  { deep: true, immediate: true },
);

const columnHelper = createColumnHelper<Task>();

function statusLabel(s: TaskStatus) {
  if (s === "todo") return "To do";
  if (s === "in_progress") return "In progress";
  return "Done";
}

const columns = [
  columnHelper.display({
    id: "drag",
    header: "",
    size: 40,
    minSize: 36,
    maxSize: 56,
    enableResizing: false,
    cell: () => "",
  }),
  columnHelper.accessor("id", {
    header: "ID",
    size: 72,
    minSize: 56,
    maxSize: 120,
  }),
  columnHelper.accessor("title", {
    header: "Title",
    size: 220,
    minSize: 140,
    maxSize: 560,
  }),
  columnHelper.accessor("assignee", {
    header: "Assignee",
    size: 120,
    minSize: 96,
    maxSize: 240,
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 130,
    minSize: 100,
    maxSize: 220,
    cell: (info) => statusLabel(info.getValue()),
  }),
  columnHelper.accessor("dueDate", {
    header: "Due date",
    size: 130,
    minSize: 110,
    maxSize: 220,
    cell: (info) => formatDate(info.getValue()),
  }),
];

const tableData = computed(() => {
  let list = tasks.sortedForTable(props.projectId);
  const q = searchDebounced.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.assignee ?? "").toLowerCase().includes(q),
    );
  }
  list = applyAdvancedFilters(list, filters.value);
  return list;
});

const table = useVueTable({
  data: tableData,
  columns,
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnSizing() {
      return columnSizing.value;
    },
  },
  onSortingChange: (updater) => {
    sorting.value = functionalUpdate(updater, sorting.value);
  },
  onColumnSizingChange: (updater) => {
    columnSizing.value = functionalUpdate(updater, columnSizing.value);
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  columnResizeMode: "onChange",
  enableColumnResizing: true,
  getRowId: (row) => String(row.id),
});

async function onDragEnd() {
  const ids = dndList.value.map((t) => t.id);
  try {
    await tasks.runOrderMutation(() =>
      tasks.reorderFromFlatOrder(props.projectId, ids),
    );
  } catch {
    toast.push("Could not save row order", "error");
    dndList.value = [...tasks.sortedForTable(props.projectId)];
  }
}

function toggleFilterPanel() {
  filterPanelOpen.value = !filterPanelOpen.value;
}
</script>

<template>
  <div class="wrap">
    <p v-if="!canDnd" class="hint" role="status">
      Reordering is disabled while sorting or filters are active.
    </p>

    <div ref="toolbarRef" class="toolbar">
      <label class="field field--grow">
        <span class="field__label">Search</span>
        <input
          v-model="search"
          class="field__input"
          type="search"
          placeholder="Title or assignee…"
          autocomplete="off"
        />
      </label>

      <div class="toolbar__filters">
        <button
          type="button"
          class="filter-btn"
          :class="{ 'filter-btn--active': hasAdvancedFilter }"
          :aria-expanded="filterPanelOpen"
          aria-controls="task-filter-panel"
          title="Filters"
          @click="toggleFilterPanel"
        >
          <svg
            class="filter-btn__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span v-if="hasAdvancedFilter" class="filter-btn__dot" />
        </button>

        <div
          v-show="filterPanelOpen"
          id="task-filter-panel"
          class="filter-panel"
          role="dialog"
          aria-label="Task filters"
          @click.stop
        >
          <div class="filter-panel__head">
            <span>Filter by fields</span>
            <button
              type="button"
              class="filter-panel__close"
              aria-label="Close"
              @click="closeFilterPanel"
            >
              ×
            </button>
          </div>

          <div class="filter-panel__grid">
            <label class="fp-field fp-field--full">
              <span class="fp-field__l">Title contains</span>
              <input
                v-model="filters.titleContains"
                class="fp-field__i"
                type="text"
                placeholder="Substring"
              />
            </label>
            <label class="fp-field fp-field--full">
              <span class="fp-field__l">Assignee contains</span>
              <input
                v-model="filters.assigneeContains"
                class="fp-field__i"
                type="text"
                placeholder="Substring"
              />
            </label>
            <fieldset class="fp-field fp-field--full fp-status">
              <legend class="fp-field__l">Status</legend>
              <label class="chk"
                ><input v-model="filters.statusTodo" type="checkbox" /> To
                do</label
              >
              <label class="chk"
                ><input v-model="filters.statusInProgress" type="checkbox" /> In
                progress</label
              >
              <label class="chk"
                ><input v-model="filters.statusDone" type="checkbox" />
                Done</label
              >
            </fieldset>
            <label class="fp-field">
              <span class="fp-field__l">Due from</span>
              <input
                v-model="filters.dueFrom"
                class="fp-field__i"
                type="date"
              />
            </label>
            <label class="fp-field">
              <span class="fp-field__l">Due to</span>
              <input v-model="filters.dueTo" class="fp-field__i" type="date" />
            </label>
          </div>

          <div class="filter-panel__foot">
            <button type="button" class="linkish" @click="resetFieldFilters">
              Reset filters
            </button>
            <button type="button" class="btn-apply" @click="closeFilterPanel">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-scroller">
      <table class="table">
        <thead>
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="th"
              :style="{ width: `${header.getSize()}px` }"
            >
              <button
                v-if="!header.isPlaceholder && header.column.id !== 'drag'"
                type="button"
                class="th__btn"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <FlexRender
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
                <span
                  v-if="header.column.getIsSorted() === 'asc'"
                  class="th__sort"
                  >▲</span
                >
                <span
                  v-else-if="header.column.getIsSorted() === 'desc'"
                  class="th__sort"
                  >▼</span
                >
              </button>
              <span
                v-else-if="header.column.id === 'drag'"
                class="th__drag-h"
              />
              <div
                v-if="header.column.getCanResize()"
                class="th__resizer"
                :class="{
                  'th__resizer--active': header.column.getIsResizing(),
                }"
                @mousedown="header.getResizeHandler()?.($event)"
                @touchstart="header.getResizeHandler()?.($event)"
              />
            </th>
          </tr>
        </thead>

        <draggable
          v-if="canDnd"
          :list="dndList"
          tag="tbody"
          item-key="id"
          handle=".drag-handle"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <tr class="tr tr--dnd" tabindex="-1">
              <td class="td td--narrow">
                <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
              </td>
              <td class="td">{{ element.id }}</td>
              <td class="td">{{ element.title }}</td>
              <td class="td">{{ element.assignee ?? "—" }}</td>
              <td class="td">{{ statusLabel(element.status) }}</td>
              <td class="td">{{ formatDate(element.dueDate) }}</td>
            </tr>
          </template>
        </draggable>

        <tbody v-else>
          <tr v-for="row in table.getRowModel().rows" :key="row.id" class="tr">
            <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="td">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "sass:color";
@use "@/styles/variables" as *;

.wrap {
  border: 1px solid $border;
  border-radius: 12px;
  background: $surface;
  overflow: visible;
}

.hint {
  margin: 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  color: $muted;
  border-bottom: 1px solid $border;
  background: rgba($primary, 0.06);
}

.toolbar {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid $border;
  z-index: 2;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field--grow {
  flex: 1;
  min-width: 0;
}

.field__label {
  font-size: 0.78rem;
  color: $muted;
}

.field__input {
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid $border;
  background: $bg;
  color: $text;

  &:focus-visible {
    @include focus-ring;
  }
}

.toolbar__filters {
  position: relative;
  flex: 0 0 auto;
}

.filter-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid $border;
  background: $bg;
  color: $muted;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    color: $text;
    border-color: color.adjust($border, $lightness: 6%);
  }

  &:focus-visible {
    @include focus-ring;
  }
}

.filter-btn--active {
  color: $primary;
  border-color: rgba($primary, 0.45);
  box-shadow: 0 0 0 1px rgba($primary, 0.2);
}

.filter-btn__icon {
  width: 20px;
  height: 20px;
}

.filter-btn__dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: $primary;
}

.filter-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: min(360px, calc(100vw - 2rem));
  max-height: min(70vh, 520px);
  overflow: auto;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid $border;
  background: $surface;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.filter-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
  font-weight: 600;
  font-size: 0.92rem;
}

.filter-panel__close {
  border: 0;
  background: transparent;
  color: $muted;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
  border-radius: 6px;

  &:hover {
    color: $text;
  }

  &:focus-visible {
    @include focus-ring;
  }
}

.filter-panel__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem 0.75rem;
}

.fp-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 0;
  border: 0;
  padding: 0;
}

.fp-field--full {
  grid-column: 1 / -1;
}

.fp-field__l {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: $muted;
}

.fp-field__i {
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  border: 1px solid $border;
  background: $bg;
  color: $text;
  font-size: 0.88rem;

  &:focus-visible {
    @include focus-ring;
  }
}

.fp-status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  text-align: left;

  legend {
    width: 100%;
    text-align: left;
    padding: 0;
  }
}

.chk {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.4rem;
  font-size: 0.88rem;
  cursor: pointer;
  width: 100%;
  text-align: left;

  input {
    accent-color: $primary;
    flex-shrink: 0;
  }
}

.filter-panel__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.85rem;
  padding-top: 0.65rem;
  border-top: 1px solid $border;
}

.linkish {
  border: 0;
  background: none;
  color: $secondary;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.25rem 0;

  &:focus-visible {
    @include focus-ring;
  }
}

.btn-apply {
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba($primary, 0.45);
  background: rgba($primary, 0.12);
  color: $text;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    filter: brightness(1.06);
  }

  &:focus-visible {
    @include focus-ring;
  }
}

.table-scroller {
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.th {
  position: relative;
  text-align: left;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: $muted;
  border-bottom: 1px solid $border;
  background: rgba($bg, 0.35);
}

.th__btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.65rem 0.75rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    @include focus-ring;
  }
}

.th__sort {
  font-size: 0.65rem;
}

.th__drag-h {
  display: block;
  padding: 0.65rem 0.5rem;
}

.th__resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 6px;
  cursor: col-resize;
  user-select: none;
  touch-action: none;

  &:hover,
  &--active {
    background: rgba($primary, 0.35);
  }
}

.td {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid rgba($border, 0.65);
  font-size: 0.9rem;
  vertical-align: middle;
}

.td--narrow {
  width: 44px;
}

.tr--dnd:hover {
  background: $row-hover;
}

.drag-handle {
  cursor: grab;
  color: $muted;
  user-select: none;
  font-weight: 700;
  letter-spacing: 0.1em;

  &:active {
    cursor: grabbing;
  }
}
</style>
