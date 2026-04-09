const DEFAULT_API_URL = "https://apidev.hidrusweb.com/api";

const DEV_LOCAL_ANDROID = "http://10.0.2.2:8080/api";
const DEV_LOCAL_IOS = "http://localhost:8080/api";

export function getApiBaseUrl() {
  const mode = process.env.EXPO_PUBLIC_API_MODE ?? "remote";

  if (mode === "local_android") return DEV_LOCAL_ANDROID;
  if (mode === "local_ios") return DEV_LOCAL_IOS;
  return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

export const APP_BEARER_TOKEN = process.env.EXPO_PUBLIC_APP_BEARER_TOKEN ?? "";
