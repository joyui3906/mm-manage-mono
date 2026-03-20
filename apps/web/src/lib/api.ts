import { getAuthContext } from "./auth";
import type { AuthContext } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

type ApiRequestOptions = {
  headers?: HeadersInit;
  cache?: RequestCache;
  method?: RequestInit["method"];
  body?: BodyInit | null;
  auth?: Partial<AuthContext>;
};

export async function callApi<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const method = options.method ?? "GET";
  const hasBody = options.body !== undefined;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const auth = {
    ...getAuthContext(),
    ...options.auth,
  };

  headers.set("x-user-id", auth.userId);
  headers.set("x-org-id", auth.orgId);
  headers.set("x-user-role", auth.role);
  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}/${normalizedPath}`, {
    method,
    headers,
    body: options.body ?? null,
    cache: options.cache,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API error ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
}
