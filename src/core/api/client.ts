import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig, isAxiosError } from "axios";
import { APP_BEARER_TOKEN, getApiBaseUrl } from "../config/env";

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

let sessionToken: string | null = null;
const debugApi = (process.env.EXPO_PUBLIC_API_DEBUG ?? "true").toLowerCase() === "true";

/** Evita vários 401 dispararem refresh em paralelo. */
let refreshInFlight: Promise<string | null> | null = null;

export function setApiAuthToken(token?: string | null) {
  sessionToken = token ?? null;
}

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

function isPublicAccountPath(url?: string) {
  if (!url) return false;
  const normalized = url.replace(/^\//, "").toLowerCase();
  return (
    normalized.startsWith("account/login") ||
    normalized.startsWith("account/register") ||
    normalized.startsWith("account/create") ||
    normalized.startsWith("account/exists") ||
    normalized.startsWith("account/password") ||
    normalized.startsWith("account/changepassword") ||
    normalized.startsWith("account/change-password") ||
    normalized.startsWith("account/passwordforgot") ||
    normalized.startsWith("account/passwordreset")
  );
}

function isTokenRefreshPath(url?: string) {
  if (!url) return false;
  const normalized = url.replace(/^\//, "").toLowerCase();
  return normalized.startsWith("account/token/refresh");
}

function looksLikeAuthSessionError(error: AxiosError): boolean {
  const data = error.response?.data as { message?: unknown } | undefined;
  const msg = typeof data?.message === "string" ? data.message.toLowerCase() : "";
  if (msg.includes("unauthenticated")) return true;
  if (msg.includes("token has expired")) return true;
  if (msg.includes("token expired")) return true;
  return false;
}

function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const token = sessionToken || APP_BEARER_TOKEN;
  if (!token) return Promise.resolve(null);

  refreshInFlight = (async () => {
    try {
      const base = getApiBaseUrl().replace(/\/$/, "");
      const { data } = await axios.post<{ accessToken?: string; token?: string }>(
        `${base}/account/token/refresh`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        },
      );
      const newToken = String(data?.accessToken ?? data?.token ?? "");
      return newToken || null;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function setRequestAuthHeader(config: InternalAxiosRequestConfig, bearer: string) {
  const h = config.headers;
  if (h instanceof AxiosHeaders) {
    h.set("Authorization", `Bearer ${bearer}`);
  } else {
    const plain = (h ?? {}) as Record<string, string>;
    plain.Authorization = `Bearer ${bearer}`;
    config.headers = plain as typeof h;
  }
}

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const url = config.url ?? "";
  const method = (config.method ?? "get").toUpperCase();

  if (!isPublicAccountPath(url) && !config.headers.Authorization) {
    const token = sessionToken || APP_BEARER_TOKEN;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  if (debugApi) {
    const body =
      typeof config.data === "object" && config.data
        ? {
            ...config.data,
            senha: config.data?.senha ? "***" : undefined,
            senhaAtual: config.data?.senhaAtual ? "***" : undefined,
            novaSenha: config.data?.novaSenha ? "***" : undefined,
          }
        : config.data;
    console.log("[API][REQ]", {
      method,
      url: `${config.baseURL ?? ""}${url}`,
      params: config.params,
      hasAuth: !!config.headers.Authorization,
      body,
    });
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (debugApi) {
      console.log("[API][RES]", {
        status: response.status,
        url: `${response.config.baseURL ?? ""}${response.config.url ?? ""}`,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    if (debugApi) {
      console.log("[API][ERR]", {
        status: error?.response?.status,
        url: `${error?.config?.baseURL ?? ""}${error?.config?.url ?? ""}`,
        method: (error?.config?.method ?? "").toUpperCase(),
        code: error?.code,
        message: error?.message,
        data: error?.response?.data,
      });
    }

    if (!isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequest;
    const url = originalRequest.url ?? "";

    const canTryRefresh =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicAccountPath(url) &&
      !isTokenRefreshPath(url) &&
      looksLikeAuthSessionError(error);

    if (canTryRefresh) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (!newToken) {
        const { useAuthStore } = await import("../../features/auth/store/useAuthStore");
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      }
      setApiAuthToken(newToken);
      const { useAuthStore } = await import("../../features/auth/store/useAuthStore");
      await useAuthStore.getState().applyRefreshedToken(newToken);
      setRequestAuthHeader(originalRequest, newToken);
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);

export function normalizeApiError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return "Tempo de resposta excedido. Tente novamente.";
    if (error.code === "ERR_NETWORK") return "Falha de rede ao acessar a API.";
    const message = (error.response?.data as any)?.message;
    const details = (error.response?.data as any)?.data?.[0]?.details;
    if (typeof message === "string" && message.length > 0) return message;
    if (typeof details === "string" && details.length > 0) return details;
    return error.message || "Erro de comunicação com servidor.";
  }
  return "Erro inesperado.";
}
