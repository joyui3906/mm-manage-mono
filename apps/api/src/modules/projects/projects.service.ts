import { ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { getPrismaClient } from "@mm/prisma";
import { AuthUser } from "../../common/types/current-user";
import { AuditService } from "../audit/audit.service";
import { assertInjectedDependency } from "../../common/di/assert";

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly prisma = getPrismaClient();

  constructor(@Inject(AuditService) private readonly auditService: AuditService) {
    assertInjectedDependency(auditService, ProjectsService.name, "AuditService");
  }

  private async ensureProjectBelongsToOrg(projectId: string, orgId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.orgId !== orgId) {
      throw new ForbiddenException("Cannot access project for this organization");
    }

    return project;
  }

  private async ensureTaskBelongsToProject(taskId: string, projectId: string, orgId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (task.projectId !== projectId || task.project.orgId !== orgId) {
      throw new ForbiddenException("Cannot access task for this organization/project");
    }

    return task;
  }

  private async ensureUserBelongsToOrg(userId: string, orgId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { orgId: true },
    });

    if (!user) {
      throw new ForbiddenException("Owner user not found");
    }

    if (user.orgId !== orgId) {
      throw new ForbiddenException("Owner user not in this organization");
    }
  }

  findAll(orgId: string) {
    return this.prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: { orgId },
    });
  }

  async findById(projectId: string, orgId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        orgId,
      },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async create(input: {
    name: string;
    code: string;
    ownerUserId?: string;
    orgId?: string;
    budgetHours?: number;
    startDate?: string;
    endDate?: string;
  }, actor: AuthUser) {
    const orgId = input.orgId ?? actor.orgId;
    const ownerUserId = (input.ownerUserId ?? actor.userId).trim();

    await this.prisma.organization.upsert({
      where: { id: orgId },
      create: {
        id: orgId,
        name: "Seed Organization",
      },
      update: {},
    });

    const owner = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
    });

    if (!owner) {
      await this.prisma.user.create({
        data: {
          id: ownerUserId,
          orgId,
          email: `${ownerUserId}@demo.local`,
          name: ownerUserId,
          role: "manager",
          skills: [],
          isActive: true,
        },
      });
    } else if (owner.orgId !== orgId) {
      throw new ForbiddenException("Owner user not in this organization");
    }

    const payload = {
      orgId,
      name: input.name,
      code: input.code,
      ownerUserId,
      budgetHours: input.budgetHours ?? 0,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      status: "planning",
    };

    const projectModel = (this.prisma as { project?: unknown }).project;
    if (!projectModel || typeof (projectModel as { create?: unknown }).create !== "function") {
      this.logger.error("project delegate missing", {
        orgId,
        userId: actor.userId,
      });
      throw new InternalServerErrorException("Project repository is unavailable");
    }

    const project = await (projectModel as { create: (args: Record<string, unknown>) => Promise<{
      id: string;
      name: string;
      code: string;
      budgetHours: number;
      status: string;
    }>} ).create({ data: payload } as any);

    await this.auditService.record({
      orgId,
      actorUserId: actor.userId,
      action: "project.create",
      resource: "project",
      resourceId: project.id,
      afterState: {
        id: project.id,
        name: project.name,
        code: project.code,
        budgetHours: project.budgetHours,
        status: project.status,
      },
      metadata: {
        source: "project.create",
      },
    });

    return project;
  }

  async findTasksByProject(projectId: string, orgId: string) {
    await this.ensureProjectBelongsToOrg(projectId, orgId);

    return this.prisma.task.findMany({
      where: {
        projectId,
        project: {
          orgId,
        },
      },
      include: {
        assignments: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTask(
    projectId: string,
    input: { title: string; plannedHours?: number; dueDate?: string },
    orgId: string,
    actor: AuthUser,
  ) {
    await this.ensureProjectBelongsToOrg(projectId, orgId);

    const taskModel = (this.prisma as { task?: unknown }).task;
    if (!taskModel || typeof (taskModel as { create?: unknown }).create !== "function") {
      this.logger.error("task delegate missing", {
        orgId,
        userId: actor.userId,
        projectId,
      });
      throw new InternalServerErrorException("Task repository is unavailable");
    }

    const task = await (taskModel as { create: (args: Record<string, unknown>) => Promise<{
      id: string;
      title: string;
      plannedHours: number;
      projectId: string;
    }>} ).create({
      data: {
        projectId,
        title: input.title,
        plannedHours: input.plannedHours ?? 0,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
      include: { assignments: true },
    });

    await this.auditService.record({
      orgId,
      actorUserId: actor.userId,
      action: "task.create",
      resource: "task",
      resourceId: task.id,
      afterState: {
        id: task.id,
        title: task.title,
        plannedHours: task.plannedHours,
        projectId,
      },
      metadata: {
        source: "task.create",
      },
    });

    return task;
  }

  async updateProject(projectId: string, input: Record<string, unknown>, orgId: string, actor: AuthUser) {
    const project = await this.ensureProjectBelongsToOrg(projectId, orgId);

    const updateData: Record<string, unknown> = {};
    if (typeof input.name === "string" && input.name.trim()) {
      updateData.name = input.name;
    }

    if (typeof input.code === "string" && input.code.trim()) {
      updateData.code = input.code;
    }

    if (typeof input.ownerUserId === "string" && input.ownerUserId.trim()) {
      const ownerUserId = input.ownerUserId.trim();
      await this.ensureUserBelongsToOrg(ownerUserId, orgId);
      updateData.ownerUserId = ownerUserId;
    }

    if (typeof input.budgetHours === "number") {
      updateData.budgetHours = input.budgetHours;
    }

    if (typeof input.status === "string") {
      updateData.status = input.status;
    }

    if (typeof input.startDate === "string" && input.startDate.trim()) {
      updateData.startDate = new Date(input.startDate);
    } else if (input.startDate === "") {
      updateData.startDate = null;
    }

    if (typeof input.endDate === "string" && input.endDate.trim()) {
      updateData.endDate = new Date(input.endDate);
    } else if (input.endDate === "") {
      updateData.endDate = null;
    }

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: updateData,
    });

    await this.auditService.record({
      orgId,
      actorUserId: actor.userId,
      action: "project.update",
      resource: "project",
      resourceId: updated.id,
      beforeState: project,
      afterState: updated,
      metadata: {
        changedKeys: Object.keys(updateData),
        source: "project.update",
      },
    });

    return updated;
  }

  async deleteProject(projectId: string, orgId: string, actor: AuthUser) {
    const project = await this.ensureProjectBelongsToOrg(projectId, orgId);

    const deleted = await this.prisma.project.delete({
      where: { id: projectId },
    });

    await this.auditService.record({
      orgId,
      actorUserId: actor.userId,
      action: "project.delete",
      resource: "project",
      resourceId: projectId,
      beforeState: project,
      metadata: {
        source: "project.delete",
      },
    });

    return deleted;
  }

  async updateTask(
    projectId: string,
    taskId: string,
    input: Record<string, unknown>,
    orgId: string,
    actor: AuthUser,
  ) {
    const task = await this.ensureTaskBelongsToProject(taskId, projectId, orgId);

    const updateData: Record<string, unknown> = {};
    if (typeof input.title === "string" && input.title.trim()) {
      updateData.title = input.title;
    }

    if (typeof input.plannedHours === "number") {
      updateData.plannedHours = input.plannedHours;
    }

    if (typeof input.status === "string") {
      updateData.status = input.status;
    }

    if (typeof input.dueDate === "string" && input.dueDate.trim()) {
      updateData.dueDate = new Date(input.dueDate);
    } else if (input.dueDate === "") {
      updateData.dueDate = null;
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { assignments: true },
    });

    await this.auditService.record({
      orgId,
      actorUserId: actor.userId,
      action: "task.update",
      resource: "task",
      resourceId: task.id,
      beforeState: task,
      afterState: updated,
      metadata: {
        changedKeys: Object.keys(updateData),
        source: "task.update",
      },
    });

    return updated;
  }

  async deleteTask(projectId: string, taskId: string, orgId: string, actor: AuthUser) {
    const task = await this.ensureTaskBelongsToProject(taskId, projectId, orgId);

    const deleted = await this.prisma.task.delete({
      where: { id: taskId },
    });

    await this.auditService.record({
      orgId,
      actorUserId: actor.userId,
      action: "task.delete",
      resource: "task",
      resourceId: taskId,
      beforeState: task,
      metadata: {
        projectId,
        source: "task.delete",
      },
    });

    return deleted;
  }
}
