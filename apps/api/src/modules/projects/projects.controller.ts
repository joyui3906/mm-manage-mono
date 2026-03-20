import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { AuthUser } from "../../common/types/current-user";
import { parseBody } from "../../common/validation/parse";
import { z } from "zod";

type CreateProjectDto = {
  name: string;
  code: string;
  ownerUserId?: string;
  budgetHours?: number;
  startDate?: string;
  endDate?: string;
};

type CreateTaskDto = {
  projectId: string;
  title: string;
  plannedHours?: number;
  dueDate?: string;
};

const createProjectSchema = z.object({
  name: z.string().min(1).max(80),
  code: z.string().min(1).max(30),
  ownerUserId: z.string().optional(),
  budgetHours: z.coerce.number().int().nonnegative().optional(),
  startDate: z
    .union([z.string(), z.undefined()])
    .transform((value: string | undefined) => (value?.trim() ? value : undefined)),
  endDate: z
    .union([z.string(), z.undefined()])
    .transform((value: string | undefined) => (value?.trim() ? value : undefined)),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(120),
  plannedHours: z.coerce.number().int().nonnegative().optional(),
  dueDate: z.union([z.string(), z.undefined()]).transform((value) => (value?.trim?.() ? value : undefined)),
});

@Controller("projects")
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  @Roles("owner", "manager", "member")
  listProjects(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.orgId);
  }

  @Get(":projectId")
  @Roles("owner", "manager", "member")
  getProject(@Param("projectId") projectId: string, @CurrentUser() user: AuthUser) {
    return this.service.findById(projectId, user.orgId);
  }

  @Post()
  @Roles("owner", "manager")
  createProject(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const payload = parseBody(createProjectSchema, body);
    return this.service.create({
      ...payload,
      ownerUserId: payload.ownerUserId ?? user?.userId,
      orgId: user?.orgId,
    });
  }

  @Get(":projectId/tasks")
  @Roles("owner", "manager", "member")
  listTasks(@Param("projectId") projectId: string, @CurrentUser() user: AuthUser) {
    return this.service.findTasksByProject(projectId, user.orgId);
  }

  @Post(":projectId/tasks")
  @Roles("owner", "manager")
  createTask(
    @Param("projectId") projectId: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const payload = parseBody(createTaskSchema, body);
    return this.service.createTask(projectId, payload, user.orgId);
  }
}
