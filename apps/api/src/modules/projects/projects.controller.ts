import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { AuthUser } from "../../common/types/current-user";

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
  createProject(@Body() payload: CreateProjectDto, @CurrentUser() user: AuthUser) {
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
  createTask(@Param("projectId") projectId: string, @Body() payload: Omit<CreateTaskDto, "projectId">, @CurrentUser() user: AuthUser) {
    return this.service.createTask(projectId, payload, user.orgId);
  }
}
