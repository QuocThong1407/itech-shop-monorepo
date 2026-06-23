export type ApiClientOptions = {
  baseUrl: string;
  token?: string;
  credentials?: RequestCredentials;
};

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${normalizePath(path)}`;
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");

  const response = await fetch(joinUrl(baseUrl, path), {
    ...init,
    headers,
  });

  if (!response.ok) {
  let message = `Request failed with status ${response.status}`;
  try {
    const body = await response.json();
    if (body?.message) message = body.message;
  } catch {
    const text = await response.text().catch(() => "");
    if (text) message = text;
  }
  throw new Error(message);
}

  return (await response.json()) as T;
}

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, token, credentials = "include" } = options;

  return {
    get<T>(path: string) {
      return apiRequest<T>(baseUrl, path, {
        method: "GET",
        credentials,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    },
    post<T>(path: string, body?: unknown) {
      return apiRequest<T>(baseUrl, path, {
        method: "POST",
        credentials,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
    put<T>(path: string, body?: unknown) {
      return apiRequest<T>(baseUrl, path, {
        method: "PUT",
        credentials,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
    patch<T>(path: string, body?: unknown) {
      return apiRequest<T>(baseUrl, path, {
        method: "PATCH",
        credentials,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
    del<T>(path: string) {
      return apiRequest<T>(baseUrl, path, {
        method: "DELETE",
        credentials,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    },
  };
}
