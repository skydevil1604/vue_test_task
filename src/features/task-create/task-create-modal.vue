<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Button from "@/shared/ui/button/button.vue";
import Input from "@/shared/ui/input/input.vue";
import Select from "@/shared/ui/select/select.vue";
import Modal from "@/shared/ui/modal/modal.vue";
import {
  ASSIGNEES,
  TASK_STATUSES,
  type TaskStatus,
} from "@/entities/task/model/types";
import { useTasksStore } from "@/entities/task/model/store";
import { useToast } from "@/shared/composables/use-toast";
import { isDueDateValid, todayIsoDate } from "@/shared/lib/date";

const props = defineProps<{
  open: boolean;
  projectId: number;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  created: [];
}>();

const tasks = useTasksStore();
const toast = useToast();

const title = ref("");
const assignee = ref(ASSIGNEES[0]);
const status = ref<TaskStatus>("todo");
const dueDate = ref("");

const titleError = ref("");
const dueError = ref("");

const statusOptions = TASK_STATUSES.map((s) => ({
  value: s,
  label: s === "todo" ? "To do" : s === "in_progress" ? "In progress" : "Done",
}));

const assigneeOptions = ASSIGNEES.map((a) => ({ value: a, label: a }));

watch(
  () => props.open,
  (v) => {
    if (v) {
      title.value = "";
      assignee.value = ASSIGNEES[0];
      status.value = "todo";
      dueDate.value = "";
      titleError.value = "";
      dueError.value = "";
    }
  },
);

function close() {
  emit("update:open", false);
}

const minDate = computed(() => todayIsoDate());

async function submit() {
  const t = title.value.trim();
  if (t.length < 3 || t.length > 120) {
    titleError.value = "Title must be 3–120 characters";
    return;
  }
  titleError.value = "";

  if (dueDate.value && !isDueDateValid(dueDate.value)) {
    dueError.value = "Due date must be today or later";
    return;
  }
  dueError.value = "";

  const siblings = tasks.tasks.filter(
    (x) => x.projectId === props.projectId && x.status === status.value,
  );
  const order =
    siblings.length === 0 ? 0 : Math.max(...siblings.map((x) => x.order)) + 1;

  try {
    await tasks.createTask({
      projectId: props.projectId,
      title: t,
      assignee: assignee.value,
      status: status.value,
      order,
      dueDate: dueDate.value || undefined,
    });
    toast.push("Task created");
    emit("created");
    close();
  } catch {
    toast.push("Could not create task", "error");
  }
}
</script>

<template>
  <Modal title="Create task" :open="props.open" @close="close">
    <Input
      id="task-title"
      v-model="title"
      label="Title *"
      placeholder="What needs to be done?"
      :error="titleError"
    />
    <div style="height: 0.75rem" />
    <Select
      id="task-assignee"
      v-model="assignee"
      label="Assignee"
      :options="assigneeOptions"
    />
    <div style="height: 0.75rem" />
    <Select
      id="task-status"
      v-model="status"
      label="Status *"
      :options="statusOptions"
    />
    <div style="height: 0.75rem" />
    <Input
      id="task-due"
      v-model="dueDate"
      type="date"
      label="Due date"
      :min="minDate"
      :error="dueError"
    />
    <template #footer>
      <Button variant="ghost" type="button" @click="close">Cancel</Button>
      <Button type="button" @click="submit">Save</Button>
    </template>
  </Modal>
</template>
