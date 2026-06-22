import {
  createAppApiClient,
  formatDateTime,
  formatMoney,
  formatPercent,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "@itech/shared";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

function redirectToLogin(nextPath: string) {
  if (typeof window === "undefined") return;
  window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
  nextPath = "/admin",
): Promise<T> {
  const client = createAppApiClient({
    baseUrl: API_BASE_URL,
    onUnauthorized: redirectToLogin,
  });
  return client.request<T>(path, init, nextPath);
}

export {
  formatDateTime,
  formatMoney,
  formatPercent,
  fromDateTimeLocal,
  toDateTimeLocal,
};

