import axios, {
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { CreateProjectDto, Project } from "@/entities/project/model/types";
import type { Task, TaskOrderUpdate } from "@/entities/task/model/types";
import * as mock from "@/shared/api/mock-backend";

function parseBody(config: InternalAxiosRequestConfig): unknown {
  const d = config.data;
  if (d == null || d === "") return undefined;
  if (typeof d === "string") {
    try {
      return JSON.parse(d) as unknown;
    } catch {
      return d;
    }
  }
  return d;
}

function pathAndSearch(config: InternalAxiosRequestConfig): {
  pathname: string;
  search: URLSearchParams;
} {
  let raw = config.url ?? "";
  const base = config.baseURL ?? "";
  if (raw.startsWith("http")) {
    const u = new URL(raw);
    return { pathname: u.pathname, search: u.searchParams };
  }
  if (base && raw.startsWith(base)) {
    raw = raw.slice(base.length) || "/";
  }
  const q = raw.includes("?") ? raw.split("?") : [raw, ""];
  const pathname = q[0] || "/";
  const search = new URLSearchParams(q[1] ?? "");
  return {
    pathname: pathname.startsWith("/") ? pathname : `/${pathname}`,
    search,
  };
}

function ok<T>(
  config: InternalAxiosRequestConfig,
  data: T,
  status = 200,
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 204 ? "No Content" : "OK",
    headers: { "content-type": "application/json" },
    config,
    request: {},
  };
}

function notFound(config: InternalAxiosRequestConfig, message: string) {
  const err = new axios.AxiosError(
    message,
    "ERR_NOT_FOUND",
    config,
    undefined,
    {
      status: 404,
      statusText: "Not Found",
      data: { error: message },
      headers: {},
      config,
    },
  );
  return Promise.reject(err);
}

/**
 * Axios adapter: усі HTTP-виклики в режимі mock проходять через Axios,
 * дані обробляються в памʼяті / localStorage (див. mock-backend).
 */
export const mockAxiosAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  const { pathname, search } = pathAndSearch(config);
  const body = parseBody(config);

  const parts = pathname.split("/").filter(Boolean);

  try {
    if (parts[0] === "projects") {
      if (parts.length === 1 && method === "get") {
        const data = await mock.mockFetchProjects();
        return ok(config, data);
      }
      if (parts.length === 1 && method === "post") {
        const data = await mock.mockCreateProject(body as CreateProjectDto);
        return ok(config, data, 201);
      }
      if (parts.length === 2) {
        const id = Number(parts[1]);
        if (Number.isNaN(id)) return notFound(config, "Invalid id");
        if (method === "get") {
          try {
            const data = await mock.mockFetchProject(id);
            return ok(config, data);
          } catch {
            return notFound(config, "Project not found");
          }
        }
        if (method === "patch") {
          try {
            const data = await mock.mockUpdateProject(
              id,
              body as Partial<Project>,
            );
            return ok(config, data);
          } catch {
            return notFound(config, "Project not found");
          }
        }
        if (method === "delete") {
          try {
            await mock.mockDeleteProject(id);
            return ok(config, undefined as void, 204);
          } catch {
            return notFound(config, "Project not found");
          }
        }
      }
    }

    if (parts[0] === "tasks") {
      if (parts.length === 1 && method === "get") {
        const pid = search.get("projectId");
        if (pid != null && pid !== "") {
          const projectId = Number(pid);
          if (Number.isNaN(projectId))
            return notFound(config, "Invalid projectId");
          const data = await mock.mockFetchTasksByProject(projectId);
          return ok(config, data);
        }
        const data = await mock.mockFetchTasks();
        return ok(config, data);
      }
      if (parts.length === 1 && method === "post") {
        const data = await mock.mockCreateTask(body as Omit<Task, "id">);
        return ok(config, data, 201);
      }
      if (
        parts.length === 2 &&
        parts[1] === "batch-order" &&
        method === "post"
      ) {
        const updates = (body as { updates?: TaskOrderUpdate[] })?.updates;
        if (!Array.isArray(updates)) {
          return Promise.reject(
            new axios.AxiosError("Invalid body", "ERR_BAD_REQUEST", config),
          );
        }
        await mock.mockUpdateTasksOrder(updates);
        return ok(config, undefined as void, 204);
      }
      if (parts.length === 2) {
        const id = Number(parts[1]);
        if (Number.isNaN(id)) return notFound(config, "Invalid id");
        if (method === "patch") {
          try {
            const data = await mock.mockUpdateTask(id, body as Partial<Task>);
            return ok(config, data);
          } catch {
            return notFound(config, "Task not found");
          }
        }
        if (method === "delete") {
          try {
            await mock.mockDeleteTask(id);
            return ok(config, undefined as void, 204);
          } catch {
            return notFound(config, "Task not found");
          }
        }
      }
    }

    return notFound(
      config,
      `No mock route: ${method.toUpperCase()} ${pathname}`,
    );
  } catch (e) {
    return Promise.reject(e instanceof Error ? e : new Error(String(e)));
  }
};
