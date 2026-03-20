import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TimesheetsService } from "./timesheets.service";
import { Roles } from "../../common/auth/roles.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthUser } from "../../common/types/current-user";
import { parseBody } from "../../common/validation/parse";
import { z } from "zod";

type CreateAssignmentDto = {
  taskId: string;
  userId: string;
  plannedHours: number;
  reason?: string;
};

type CreateTimeEntryDto = {
  taskId: string;
  userId: string;
  date: string;
  hours: number;
  note?: string;
};

const createAssignmentSchema = z.object({
  taskId: z.string().min(1),
  userId: z.string().min(1),
  plannedHours: z.coerce.number().int().positive(),
  reason: z.string().optional(),
});

const createTimeEntrySchema = z.object({
  taskId: z.string().min(1),
  userId: z.string().min(1),
  date: z.string().min(1),
  hours: z.coerce.number().nonnegative(),
  note: z.string().optional(),
});

@Controller("timesheets")
export class TimesheetsController {
  constructor(private readonly service: TimesheetsService) {}

  @Get("assignments")
  @Roles("owner", "manager", "member")
  listAssignments(@CurrentUser() user: AuthUser) {
    return this.service.findAssignments(user.orgId);
  }

  @Get("users")
  @Roles("owner", "manager", "member")
  listUsers(@CurrentUser() user: AuthUser) {
    return this.service.findUsers(user.orgId);
  }

  @Get("tasks")
  @Roles("owner", "manager", "member")
  listTasks(@CurrentUser() user: AuthUser) {
    return this.service.findTasks(user.orgId);
  }

  @Post("assignments")
  @Roles("owner", "manager")
  createAssignment(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const payload = parseBody(createAssignmentSchema, body);
    return this.service.createAssignment(payload, user);
  }

  @Get("entries")
  @Roles("owner", "manager", "member")
  listEntries(@CurrentUser() user: AuthUser) {
    return this.service.findEntries(user.orgId);
  }

  @Post("entries")
  @Roles("owner", "manager", "member")
  createEntry(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const payload = parseBody(createTimeEntrySchema, body);
    return this.service.createEntry(payload, user);
  }

  @Post("assignments/:id/approve")
  @Roles("owner", "manager")
  approve(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.updateAssignmentStatus(id, "approved", user.orgId);
  }

  @Post("assignments/:id/reject")
  @Roles("owner", "manager")
  reject(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.updateAssignmentStatus(id, "rejected", user.orgId);
  }

  @Post("assignments/:id/cancel")
  @Roles("owner", "manager", "member")
  cancel(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.cancelAssignment(id, user);
  }
}
