/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** In-browser REST mock (GitHub Pages / static hosting) */
  readonly VITE_MOCK_API?: string;
  /** Vite public path, e.g. `/repo-name/` for GitHub Pages */
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
