import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { getPrismaClient } from "@mm/prisma";

@Injectable()
export class ProjectsService {
  private readonly prisma = getPrismaClient();

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
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { orgId: true },
    });

    if (!project || project.orgId !== orgId) {
      throw new ForbiddenException("Cannot create task for this project");
    }

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
}
