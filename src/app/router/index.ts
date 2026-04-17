import { createRouter, createWebHistory } from "vue-router";
import AppLayout from "@/layouts/app-layout.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: AppLayout,
      children: [
        {
          path: "",
          name: "projects",
          component: () => import("@/pages/projects/projects-page.vue"),
        },
        {
          path: "projects/:id",
          name: "project-details",
          component: () =>
            import("@/pages/project-details/project-details-page.vue"),
          props: true,
        },
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("@/pages/dashboard/dashboard-page.vue"),
        },
      ],
    },
  ],
});
