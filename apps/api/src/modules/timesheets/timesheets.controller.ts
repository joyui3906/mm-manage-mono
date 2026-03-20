import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TimesheetsService } from "./timesheets.service";
import { Roles } from "../../common/auth/roles.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthUser } from "../../common/types/current-user";

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
  createAssignment(@Body() payload: CreateAssignmentDto, @CurrentUser() user: AuthUser) {
    return this.service.createAssignment(payload, user);
  }

  @Get("entries")
  @Roles("owner", "manager", "member")
  listEntries(@CurrentUser() user: AuthUser) {
    return this.service.findEntries(user.orgId);
  }

  @Post("entries")
  @Roles("owner", "manager", "member")
  createEntry(@Body() payload: CreateTimeEntryDto, @CurrentUser() user: AuthUser) {
    return this.service.createEntry(payload, user);
  }

  @Post("assignments/:id/approve")
  @Roles("owner", "manager")
  approve(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.updateAssignmentStatus(id, "approved", user.orgId);
  }
}
