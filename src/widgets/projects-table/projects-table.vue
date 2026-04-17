<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
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
import { debounce } from "@/shared/lib/debounce";
import { formatDate } from "@/shared/lib/date";
import { loadJson, saveJson } from "@/shared/lib/storage";
import type { Project } from "@/entities/project/model/types";

export type ProjectRow = Project & { tasksCount: number };

const props = defineProps<{
  rows: ProjectRow[];
  loading?: boolean;
}>();

const router = useRouter();

const STORAGE_KEY = "ui:projectsTable:v1";

const saved = loadJson<{ sorting: SortingState; columnSizing: ColumnSizingState }>(
  STORAGE_KEY,
  { sorting: [], columnSizing: {} },
);

const sorting = ref<SortingState>(saved.sorting);
const columnSizing = ref<ColumnSizingState>(saved.columnSizing);

const persist = debounce(() => {
  saveJson(STORAGE_KEY, {
    sorting: sorting.value,
    columnSizing: columnSizing.value,
  });
}, 300);

watch([sorting, columnSizing], persist, { deep: true });

const columnHelper = createColumnHelper<ProjectRow>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    size: 72,
    minSize: 56,
    maxSize: 400,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    size: 280,
    minSize: 120,
    maxSize: 640,
  }),
  columnHelper.accessor("tasksCount", {
    header: "Tasks",
    size: 96,
    minSize: 72,
    maxSize: 200,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 120,
    minSize: 96,
    maxSize: 240,
    cell: (info) =>
      info.getValue() === "active" ? "Active" : "Completed",
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    size: 160,
    minSize: 120,
    maxSize: 320,
    cell: (info) => formatDate(info.getValue()),
  }),
];

const tableData = computed(() => props.rows);

const table = useVueTable({
  data: tableData,
  columns,
  defaultColumn: {
    minSize: 40,
    maxSize: 800,
  },
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

function goRow(row: ProjectRow) {
  router.push({ name: "project-details", params: { id: String(row.id) } });
}
</script>

<template>
  <div class="wrap">
    <div v-if="loading" class="skeleton" aria-busy="true">
      <div class="skeleton__bar" />
      <div class="skeleton__bar skeleton__bar--short" />
    </div>

    <div v-else class="table-scroller">
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
                v-if="!header.isPlaceholder"
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
              <div
                class="th__resizer"
                :class="{ 'th__resizer--active': header.column.getIsResizing() }"
                @dblclick.stop
                @mousedown="header.getResizeHandler()?.($event)"
                @touchstart="header.getResizeHandler()?.($event)"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="tr"
            tabindex="0"
            @click="goRow(row.original)"
            @keydown.enter="goRow(row.original)"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="td"
            >
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
@use "@/styles/variables" as *;

.wrap {
  border: 1px solid $border;
  border-radius: 12px;
  background: $surface;
  overflow: hidden;
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
  user-select: none;
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
  opacity: 0.85;
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
  background: transparent;

  &:hover,
  &--active {
    background: rgba($primary, 0.35);
  }
}

.td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid rgba($border, 0.65);
  font-size: 0.92rem;
}

.tr {
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: $row-hover;
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 3px 0 0 $primary;
    background: rgba($row-hover, 0.85);
  }
}

.skeleton {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.skeleton__bar {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba($border, 0.35),
    rgba($muted, 0.2),
    rgba($border, 0.35)
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.skeleton__bar--short {
  width: 55%;
}

@keyframes shimmer {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: -200% 0%;
  }
}
</style>
