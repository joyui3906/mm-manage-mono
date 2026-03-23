import { z } from "zod";

export { z };

export const RoleEnum = z.enum(["owner", "manager", "member"]);
export type Role = z.infer<typeof RoleEnum>;

export const ProjectStatusEnum = z.enum(["planning", "active", "on_hold", "done", "cancelled"]);
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

export const TaskStatusEnum = z.enum(["todo", "in_progress", "blocked", "done"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const AssignmentStatusEnum = z.enum(["pending", "approved", "rejected"]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusEnum>;

export const DashboardKpiTypeEnum = z.enum(["utilization", "overload", "unassigned"]);
export type DashboardKpiType = z.infer<typeof DashboardKpiTypeEnum>;

export const TimeEntrySchema = z.object({
  taskId: z.string(),
  userId: z.string(),
  date: z.string(),
  hours: z.number().nonnegative(),
});

export const AssignmentSchema = z.object({
  taskId: z.string(),
  userId: z.string(),
  projectId: z.string().optional(),
  plannedHours: z.number().nonnegative(),
  reason: z.string().optional(),
  status: AssignmentStatusEnum,
});

export type TimeEntryInput = z.infer<typeof TimeEntrySchema>;
export type AssignmentInput = z.infer<typeof AssignmentSchema>;

export type AuthTokenRole = Role;

export type AuthTokenPayload = {
  sub: string;
  userId: string;
  orgId: string;
  role: AuthTokenRole;
  iat: number;
  exp: number;
};

const base64UrlDecode = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(padding)}`;
  const decoded = (() => {
    if (typeof atob === "function") {
      return atob(padded);
    }

    return Buffer.from(padded, "base64").toString("binary");
  })();
  const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const parseBearerToken = (authorization: string | null | undefined): string | undefined => {
  if (!authorization || !authorization.trim()) {
    return undefined;
  }

  const [scheme, token] = authorization.split(/\s+/);
  if (!token) {
    return undefined;
  }

  if (!scheme || scheme.toLowerCase() !== "bearer") {
    return undefined;
  }

  return token.trim();
};

const authTokenPayloadSchema = z.object({
  sub: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  orgId: z.string().trim().min(1),
  role: RoleEnum,
  iat: z.number(),
  exp: z.number(),
});

export const decodeUnsafeAuthToken = (token: string): AuthTokenPayload | undefined => {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;

  try {
    const decodedPayload = JSON.parse(base64UrlDecode(parts[1]));
    const parsedResult = authTokenPayloadSchema.safeParse(decodedPayload);
    if (!parsedResult.success) {
      return undefined;
    }
    return parsedResult.data;
  } catch {
    return undefined;
  }
};
