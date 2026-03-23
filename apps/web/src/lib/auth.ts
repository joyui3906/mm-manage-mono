import { headers } from "next/headers";
import { decodeUnsafeAuthToken, parseBearerToken } from "@mm/shared";

export type Role = "owner" | "manager" | "member";

export type AuthContext = {
  userId: string;
  orgId: string;
  role: Role;
};

type HeaderSource = {
  get(name: string): string | null;
};

const DEFAULT_ROLE: Role =
  (process.env.MM_DEFAULT_USER_ROLE as Role) ?? process.env.MM_DEMO_USER_ROLE ?? "member";
const DEFAULT_ORG_ID = process.env.MM_DEFAULT_ORG_ID ?? process.env.MM_DEMO_ORG_ID ?? "seed-org-id";
const DEFAULT_USER_ID = process.env.MM_DEFAULT_USER_ID ?? process.env.MM_DEMO_USER_ID ?? "dev-user";
const ACCESS_TOKEN_COOKIE = "mm_access_token";

const parseCookieValue = (cookieHeader: string | null, name: string) => {
  if (!cookieHeader) {
    return undefined;
  }

  const match = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  if (!match) {
    return undefined;
  }

  const index = match.indexOf("=");
  if (index < 0) {
    return undefined;
  }

  return decodeURIComponent(match.substring(index + 1));
};

export const DEFAULT_AUTH_CONTEXT: AuthContext = {
  userId: DEFAULT_USER_ID,
  orgId: DEFAULT_ORG_ID,
  role: DEFAULT_ROLE,
};

const isRole = (value: string | null | undefined): value is Role =>
  value === "owner" || value === "manager" || value === "member";

const parseHeaderValue = (value: string | null | undefined, fallback: string): string =>
  value && value.trim() ? value.trim() : fallback;

const parseTokenContext = (token: string | undefined): Partial<AuthContext> => {
  if (!token) {
    return {};
  }

  const decoded = decodeUnsafeAuthToken(token);
  if (!decoded || decoded.exp < Math.floor(Date.now() / 1000) || !isRole(decoded.role)) {
    return {};
  }

  return {
    userId: decoded.userId,
    orgId: decoded.orgId,
    role: decoded.role,
  };
};

const hasUsableToken = (token: string | undefined): token is string => {
  const decoded = token ? decodeUnsafeAuthToken(token) : undefined;
  return !!decoded && decoded.exp >= Math.floor(Date.now() / 1000);
};

const getAuthToken = (headerSource: HeaderSource): string | undefined => {
  const authorizationToken = parseBearerToken(headerSource.get("authorization"));
  if (authorizationToken) {
    return hasUsableToken(authorizationToken) ? authorizationToken : undefined;
  }

  const token = parseCookieValue(headerSource.get("cookie"), ACCESS_TOKEN_COOKIE);
  if (!token) {
    return undefined;
  }

  return hasUsableToken(token) ? token : undefined;
};

const getSafeHeaderSource = (): HeaderSource | undefined => {
  try {
    return headers();
  } catch {
    return undefined;
  }
};

const resolveAuthContext = (headerSource?: HeaderSource): AuthContext => {
  if (!headerSource) {
    return DEFAULT_AUTH_CONTEXT;
  }

  try {
    return readAuthContextFromHeaders(headerSource);
  } catch {
    return DEFAULT_AUTH_CONTEXT;
  }
};

const readAuthContextFromHeaders = (headerSource: HeaderSource): AuthContext => {
  const token = getAuthToken(headerSource);
  const tokenContext = parseTokenContext(token);

  const headersUserId = parseHeaderValue(
    headerSource.get("x-mm-user-id") ?? headerSource.get("x-user-id"),
    tokenContext.userId ?? DEFAULT_USER_ID,
  );
  const headersOrgId = parseHeaderValue(
    headerSource.get("x-mm-org-id") ?? headerSource.get("x-org-id"),
    tokenContext.orgId ?? DEFAULT_ORG_ID,
  );
  const headersRole = parseHeaderValue(
    headerSource.get("x-mm-user-role") ?? headerSource.get("x-user-role"),
    tokenContext.role ?? DEFAULT_ROLE,
  );
  const role = isRole(tokenContext.role) ? tokenContext.role : isRole(headersRole) ? headersRole : DEFAULT_ROLE;

  return {
    userId: headersUserId,
    orgId: headersOrgId,
    role,
  };
};

export function getAuthContext(overrides?: Partial<AuthContext>): AuthContext {
  const headerContext = resolveAuthContext(getSafeHeaderSource());

  return {
    ...headerContext,
    ...overrides,
  };
}

export function getAuthTokenFromContext(headerSource?: HeaderSource): string | undefined {
  const source = headerSource ?? getSafeHeaderSource();
  if (!source) {
    return undefined;
  }

  return getAuthToken(source);
}

export function getAuthContextServer(headersSource: HeaderSource, overrides?: Partial<AuthContext>) {
  const headerContext = readAuthContextFromHeaders(headersSource);
  return {
    ...headerContext,
    ...overrides,
  };
}

export function canWriteProject(role: Role) {
  return role === "owner" || role === "manager";
}

export function canManageUsers(role: Role) {
  return role === "owner" || role === "manager";
}
