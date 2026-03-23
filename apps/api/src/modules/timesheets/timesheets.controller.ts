import { Body, Controller, Get, Inject, Param, Post, Query, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { TimesheetsService } from "./timesheets.service";
import { Roles } from "../../common/auth/roles.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthUser } from "../../common/types/current-user";
import { parseBody } from "../../common/validation/parse";
import { assertInjectedDependency } from "../../common/di/assert";

const exportQuerySchema = z.object({
  resource: z.enum(["entries", "assignments"]).default("entries"),
  teamId: z.string().optional(),
});

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

type CsvExportResponse = {
  status: (code: number) => CsvExportResponse;
  send: (body: string) => unknown;
  setHeader: (name: string, value: string) => void;
};

@Controller("timesheets")
@ApiTags("timesheets")
export class TimesheetsController {
  constructor(@Inject(TimesheetsService) private readonly service: TimesheetsService) {
    assertInjectedDependency(service, TimesheetsController.name, "TimesheetsService");
  }

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
    return this.service.updateAssignmentStatus(id, "approved", user);
  }

  @Post("assignments/:id/reject")
  @Roles("owner", "manager")
  reject(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.updateAssignmentStatus(id, "rejected", user);
  }

  @Post("assignments/:id/cancel")
  @Roles("owner", "manager", "member")
  cancel(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.cancelAssignment(id, user);
  }

  @Get("export")
  @Roles("owner", "manager", "member")
  async exportCsv(
    @Query() query: Record<string, string | string[] | undefined>,
    @CurrentUser() user: AuthUser,
    @Res() response: CsvExportResponse,
  ) {
    const payload = exportQuerySchema.safeParse({
      resource: normalizeQuery(query.resource),
      teamId: normalizeQuery(query.teamId),
    });
    if (!payload.success) {
      return response.status(400).send("invalid export query");
    }

    const csv = await this.service.exportCsv(payload.data.resource, user, payload.data.teamId);
    const filename = `${payload.data.resource}-export.csv`;

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    response.setHeader("Cache-Control", "no-store");
    return response.send(csv);
  }
}

function normalizeQuery(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0] ?? undefined;
  return value;
}
