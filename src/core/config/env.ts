const DEFAULT_API_URL = "https://apidev.hidrusweb.com/api";

/** Emulador Android: 10.0.2.2 = localhost do PC. Não use no iOS. */
const DEV_LOCAL_ANDROID = "http://10.0.2.2:8000/api";
/** Simulador iOS (mesmo Mac que o Metro): mesmo loopback do host. */
const DEV_LOCAL_IOS = "http://127.0.0.1:8000/api";

/**
 * Base URL da API (termina em /api).
 *
 * - `remote`: EXPO_PUBLIC_API_URL ou apidev.
 * - `local_ios`: 127.0.0.1:8000 — iPhone físico não alcança; aí use EXPO_PUBLIC_API_URL=http://IP_DO_MAC:8000/api
 *   e `php artisan serve --host=0.0.0.0 --port=8000`.
 * - `local_android`: 10.0.2.2:8000 — só emulador Android.
 */
export function getApiBaseUrl() {
  const mode = process.env.EXPO_PUBLIC_API_MODE ?? "remote";

  if (mode === "local_android") return DEV_LOCAL_ANDROID;
  if (mode === "local_ios") return DEV_LOCAL_IOS;
  return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

export const APP_BEARER_TOKEN = process.env.EXPO_PUBLIC_APP_BEARER_TOKEN ?? "";
