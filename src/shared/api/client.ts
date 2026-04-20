import axios from "axios";
import { mockAxiosAdapter } from "@/shared/api/mock-axios-adapter";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const useMockAdapter = import.meta.env.VITE_MOCK_API === "true";

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  adapter: useMockAdapter ? mockAxiosAdapter : undefined,
});
