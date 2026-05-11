import axios, { AxiosInstance } from "axios";
import { getTokenFromStorage, clearTokenFromStorage } from "@/lib/auth/storage";

const DEFAULT_PIPELINE_API_BASE_URL = "http://220.130.209.122:41432";

const baseURL = (
  process.env.NEXT_PUBLIC_PIPELINE_API_BASE_URL ??
  DEFAULT_PIPELINE_API_BASE_URL
).replace(/\/$/, "");

// ── Shared Interceptors Logic ────────────────────────────

const setupInterceptors = (instance: AxiosInstance) => {
  // Request Interceptor: Attach Bearer token
  instance.interceptors.request.use(
    (config) => {
      const token = getTokenFromStorage();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response Interceptor: Handle 401 (token expired)
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        error.response?.status === 401 &&
        typeof window !== "undefined"
      ) {
        clearTokenFromStorage();
        // Redirect to login if not already there
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

// ── Exported Instances ──────────────────────────────────

/**
 * Standard API instance for common CRUD, Auth, and IAM operations.
 * Timeout: 30 seconds.
 */
export const api = setupInterceptors(
  axios.create({
    baseURL,
    timeout: 30_000,
    headers: {
      accept: "application/json",
    },
  })
);

/**
 * Long-running API instance for LLM pipelines and heavy data processing.
 * Timeout: 25 minutes.
 */
export const pipelineApi = setupInterceptors(
  axios.create({
    baseURL,
    timeout: 1_500_000,
    headers: {
      accept: "application/json",
    },
  })
);
