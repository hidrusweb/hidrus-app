import axios from "axios";
import { APP_BEARER_TOKEN, getApiBaseUrl } from "../config/env";

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

let sessionToken: string | null = null;
const debugApi = (process.env.EXPO_PUBLIC_API_DEBUG ?? "true").toLowerCase() === "true";

export function setApiAuthToken(token?: string | null) {
  sessionToken = token ?? null;
}

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

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const url = config.url ?? "";
  const method = (config.method ?? "get").toUpperCase();

  if (!isPublicAccountPath(url) && !config.headers.Authorization) {
    const token = sessionToken || APP_BEARER_TOKEN;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  if (debugApi) {
    const body = typeof config.data === "object" && config.data
      ? { ...config.data, senha: config.data?.senha ? "***" : undefined, senhaAtual: config.data?.senhaAtual ? "***" : undefined, novaSenha: config.data?.novaSenha ? "***" : undefined }
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
  (error) => {
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
    return Promise.reject(error);
  },
);

export function normalizeApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
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
