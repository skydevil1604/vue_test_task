import { ref } from "vue";

export type ToastItem = {
  id: number;
  message: string;
  kind: "success" | "error";
};

const items = ref<ToastItem[]>([]);
let seq = 0;

export function useToast() {
  function push(message: string, kind: ToastItem["kind"] = "success") {
    const id = ++seq;
    items.value = [...items.value, { id, message, kind }];
    window.setTimeout(() => {
      items.value = items.value.filter((t) => t.id !== id);
    }, 3000);
  }

  return { items, push };
}
