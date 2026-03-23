import { getAuthContext } from "./auth";
import { getAuthTokenFromContext } from "./auth";
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
  requestId?: string;

  constructor(
    statusCode: number,
    message: string,
    options: { path?: string; details?: ApiErrorDetails[]; requestId?: string } = {},
  ) {
    super(message);
    this.statusCode = statusCode;
    this.path = options.path;
    this.details = options.details ?? [];
    this.requestId = options.requestId;
    this.name = "ApiRequestError";
  }
}

const AUTH_REDIRECT_MESSAGE_BY_STATUS: Record<number, string> = {
  401: "로그인이 필요합니다. 로그인 후 다시 시도해 주세요.",
  403: "권한이 없습니다. 해당 계정에 필요한 권한이 있는지 확인해 주세요.",
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
  const token = getAuthTokenFromContext();

  headers.set("x-user-id", auth.userId);
  headers.set("x-org-id", auth.orgId);
  headers.set("x-user-role", auth.role);
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
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
    let requestId: string | undefined;
    let details: ApiErrorDetails[] = [];

    try {
      const errorPayload = await response.json();
      if (errorPayload && typeof errorPayload === "object") {
        message = typeof errorPayload.message === "string" ? errorPayload.message : message;
        pathValue = typeof errorPayload.path === "string" ? errorPayload.path : undefined;
        requestId = typeof errorPayload.requestId === "string" ? errorPayload.requestId : undefined;
        if (Array.isArray(errorPayload.details)) {
          details = errorPayload.details.filter(
            (item: unknown): item is ApiErrorDetails =>
              !!item && typeof item === "object" && typeof (item as { message?: unknown }).message === "string",
          );
        }
      }
      if (!requestId) {
        requestId = response.headers.get("x-request-id") ?? undefined;
      }
    } catch {
      const text = await response.text().catch(() => undefined);
      if (text) {
        message = `${message}: ${text}`;
      }
    }

    throw new ApiRequestError(response.status, message, { path: pathValue, details, requestId });
  }

  return response.json() as Promise<T>;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const raw = error.message;
    const mappedMessage = AUTH_REDIRECT_MESSAGE_BY_STATUS[error.statusCode];
    if (mappedMessage) {
      return mappedMessage;
    }

    if (error.statusCode >= 500) {
      return error.requestId
        ? `요청 처리 중 오류가 발생했습니다. [요청 ID: ${error.requestId}]`
        : "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }

    const internalText = ["internal server", "cannot read properties of undefined"];
    if (internalText.some((text) => raw.toLowerCase().includes(text.toLowerCase()))) {
      return "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }

    const visibleDetails = error.details.filter((detail) => {
      if (!detail.path) {
        return true;
      }

      if (detail.path === "stack" || detail.path === "internal") {
        return false;
      }

      if (Array.isArray(detail.path)) {
        return detail.path[0] !== "stack" && detail.path[0] !== "internal";
      }

      return true;
    });

    if (!visibleDetails.length) {
      return raw;
    }

    const detailMessage = visibleDetails
      .map((detail) => detail.message)
      .filter(Boolean)
      .join("; ");

    if (raw === detailMessage || !detailMessage) {
      return raw;
    }

    return `${raw}: ${detailMessage}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
}
