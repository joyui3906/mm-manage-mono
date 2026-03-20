import { z } from "zod";

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
