import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { getPrismaClient } from "@mm/prisma";

@Injectable()
export class ProjectsService {
  private readonly prisma = getPrismaClient();

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
  }) {
    const orgId = input.orgId ?? "seed-org-id";
    const ownerUserId = input.ownerUserId ?? "dev-user";

    await this.prisma.organization.upsert({
      where: { id: orgId },
      create: {
        id: orgId,
        name: "Seed Organization",
      },
      update: {},
    });

    await this.prisma.user.upsert({
      where: { id: ownerUserId },
      create: {
        id: ownerUserId,
        orgId,
        email: `${ownerUserId}@demo.local`,
        name: ownerUserId,
        role: "manager",
        skills: [],
        isActive: true,
      },
      update: {
        orgId,
      },
    });

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

    return this.prisma.project.create({ data: payload } as any);
  }

  async findTasksByProject(projectId: string, orgId: string) {
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
  ) {
    await this.ensureProjectBelongsToOrg(projectId, orgId);

    return this.prisma.task.create({
      data: {
        projectId,
        title: input.title,
        plannedHours: input.plannedHours ?? 0,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
      include: { assignments: true },
    });
  }

  async updateProject(projectId: string, input: Record<string, unknown>, orgId: string) {
    const project = await this.ensureProjectBelongsToOrg(projectId, orgId);

    const updateData: Record<string, unknown> = {};
    if (typeof input.name === "string" && input.name.trim()) {
      updateData.name = input.name;
    }

    if (typeof input.code === "string" && input.code.trim()) {
      updateData.code = input.code;
    }

    if (typeof input.ownerUserId === "string" && input.ownerUserId.trim()) {
      updateData.ownerUserId = input.ownerUserId;
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

    return this.prisma.project.update({
      where: { id: project.id },
      data: updateData,
    });
  }

  async deleteProject(projectId: string, orgId: string) {
    await this.ensureProjectBelongsToOrg(projectId, orgId);

    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  async updateTask(
    projectId: string,
    taskId: string,
    input: Record<string, unknown>,
    orgId: string,
  ) {
    await this.ensureTaskBelongsToProject(taskId, projectId, orgId);

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

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { assignments: true },
    });
  }

  async deleteTask(projectId: string, taskId: string, orgId: string) {
    await this.ensureTaskBelongsToProject(taskId, projectId, orgId);

    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }
}
