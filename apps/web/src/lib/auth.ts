import { headers } from "next/headers";

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

export const DEFAULT_AUTH_CONTEXT: AuthContext = {
  userId: DEFAULT_USER_ID,
  orgId: DEFAULT_ORG_ID,
  role: DEFAULT_ROLE,
};

const isRole = (value: string | null | undefined): value is Role =>
  value === "owner" || value === "manager" || value === "member";

const parseHeaderValue = (value: string | null | undefined, fallback: string): string =>
  value && value.trim() ? value.trim() : fallback;

const parseAuthorizationContext = (authorization: string | null): Partial<AuthContext> => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return {};
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return {};
  }

  const segments = token.split(".");
  if (segments.length !== 3) {
    return {};
  }

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    const decoded = JSON.parse(json) as Partial<AuthContext> & { sub?: string };
    return {
      userId: decoded.userId ?? decoded.sub,
      orgId: decoded.orgId,
      role: isRole(decoded.role) ? decoded.role : undefined,
    };
  } catch {
    return {};
  }
};

const readAuthContextFromHeaders = (headerSource: HeaderSource): AuthContext => {
  const authorizationContext = parseAuthorizationContext(headerSource.get("authorization"));
  const headersUserId = parseHeaderValue(
    headerSource.get("x-mm-user-id") ?? headerSource.get("x-user-id"),
    authorizationContext.userId ?? DEFAULT_USER_ID,
  );
  const headersOrgId = parseHeaderValue(
    headerSource.get("x-mm-org-id") ?? headerSource.get("x-org-id"),
    authorizationContext.orgId ?? DEFAULT_ORG_ID,
  );
  const headersRole = parseHeaderValue(
    headerSource.get("x-mm-user-role") ?? headerSource.get("x-user-role"),
    DEFAULT_ROLE,
  );
  const role = isRole(authorizationContext.role) ? authorizationContext.role : isRole(headersRole) ? headersRole : DEFAULT_ROLE;

  return {
    userId: headersUserId,
    orgId: headersOrgId,
    role,
  };
};

export function getAuthContext(overrides?: Partial<AuthContext>): AuthContext {
  const headerContext = readAuthContextFromHeaders(headers());

  return {
    ...headerContext,
    ...overrides,
  };
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
