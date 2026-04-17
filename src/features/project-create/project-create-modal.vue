<script setup lang="ts">
import { ref, watch } from "vue";
import Button from "@/shared/ui/button/button.vue";
import Input from "@/shared/ui/input/input.vue";
import Modal from "@/shared/ui/modal/modal.vue";
import { useProjectsStore } from "@/entities/project/model/store";
import { useToast } from "@/shared/composables/use-toast";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  "update:open": [value: boolean];
  created: [];
}>();

function setOpen(v: boolean) {
  emit("update:open", v);
}

const projects = useProjectsStore();
const toast = useToast();

const name = ref("");
const description = ref("");
const nameError = ref("");

watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = "";
      description.value = "";
      nameError.value = "";
    }
  },
);

function close() {
  setOpen(false);
}

async function submit() {
  const n = name.value.trim();
  if (!n) {
    nameError.value = "Name is required";
    return;
  }
  nameError.value = "";
  try {
    await projects.create({
      name: n,
      description: description.value.trim() || undefined,
      status: "active",
    });
    toast.push("Project created");
    emit("created");
    close();
  } catch {
    toast.push("Could not create project", "error");
  }
}
</script>

<template>
  <Modal title="Create project" :open="props.open" @close="close">
    <Input
      id="project-name"
      v-model="name"
      label="Project name *"
      placeholder="e.g. Marketing site"
      :error="nameError"
    />
    <div style="height: 0.75rem" />
    <Input
      id="project-desc"
      v-model="description"
      label="Description"
      placeholder="Optional"
    />
    <template #footer>
      <Button variant="ghost" type="button" @click="close">Cancel</Button>
      <Button type="button" @click="submit">Create</Button>
    </template>
  </Modal>
</template>
