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

type ApiErrorDetails = {
  path?: string | string[];
  message: string;
};

export class ApiRequestError extends Error {
  statusCode: number;
  details: ApiErrorDetails[];
  path?: string;

  constructor(statusCode: number, message: string, options: { path?: string; details?: ApiErrorDetails[] } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.path = options.path;
    this.details = options.details ?? [];
    this.name = "ApiRequestError";
  }
}

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
    let message = `API error ${response.status}`;
    let pathValue: string | undefined;
    let details: ApiErrorDetails[] = [];

    try {
      const errorPayload = await response.json();
      if (errorPayload && typeof errorPayload === "object") {
        message = typeof errorPayload.message === "string" ? errorPayload.message : message;
        pathValue = typeof errorPayload.path === "string" ? errorPayload.path : undefined;
        if (Array.isArray(errorPayload.details)) {
          details = errorPayload.details.filter(
            (item: unknown): item is ApiErrorDetails =>
              !!item && typeof item === "object" && typeof (item as { message?: unknown }).message === "string",
          );
        }
      }
    } catch {
      const text = await response.text().catch(() => undefined);
      if (text) {
        message = `${message}: ${text}`;
      }
    }

    throw new ApiRequestError(response.status, message, { path: pathValue, details });
  }

  return response.json() as Promise<T>;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
}
