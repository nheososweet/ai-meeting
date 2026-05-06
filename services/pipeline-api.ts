import axios from "axios";
import { getTokenFromStorage, clearTokenFromStorage } from "@/lib/auth/storage";

const DEFAULT_PIPELINE_API_BASE_URL = "http://220.130.209.122:41432";

const baseURL = (
  process.env.NEXT_PUBLIC_PIPELINE_API_BASE_URL ??
  DEFAULT_PIPELINE_API_BASE_URL
).replace(/\/$/, "");

export const pipelineApi = axios.create({
  baseURL,
  timeout: 1_500_000,
  headers: {
    accept: "application/json",
  },
});

// ── Request Interceptor: Attach Bearer token ────────────

pipelineApi.interceptors.request.use(
  (config) => {
    const token = getTokenFromStorage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Handle 401 (token expired) ────

pipelineApi.interceptors.response.use(
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
