import type { Role } from "@mm/shared";

export interface AuthUser {
  userId: string;
  orgId: string;
  role: Role;
  ipAddress?: string;
  userAgent?: string;
}

export type AuthenticatedRequest = {
  user?: AuthUser;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  [key: string]: unknown;
};
