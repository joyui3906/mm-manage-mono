import { ForbiddenException, Injectable } from "@nestjs/common";
import { getPrismaClient } from "@mm/prisma";
import { AuthUser } from "../../common/types/current-user";

@Injectable()
export class TimesheetsService {
  private readonly prisma = getPrismaClient();

  findAssignments(orgId: string) {
    return this.prisma.taskAssignment.findMany({
      include: {
        task: {
          select: { id: true, title: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      where: {
        task: {
          project: {
            orgId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findUsers(orgId: string) {
    return this.prisma.user.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
  }

  findTasks(orgId: string) {
    return this.prisma.task.findMany({
      where: {
        project: {
          orgId,
        },
      },
      select: {
        id: true,
        title: true,
        plannedHours: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createAssignment(
    input: { taskId: string; userId: string; plannedHours: number; reason?: string },
    actor: AuthUser,
  ) {
    const [targetTask, targetUser] = await Promise.all([
      this.prisma.task.findUnique({
        where: { id: input.taskId },
        select: {
          project: {
            select: { orgId: true },
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { orgId: true },
      }),
    ]);

    if (!targetTask || !targetUser) {
      throw new ForbiddenException("Invalid task or user");
    }

    if (targetTask.project.orgId !== actor.orgId || targetUser.orgId !== actor.orgId) {
      throw new ForbiddenException("Cross organization assignment is not allowed");
    }

    return this.prisma.taskAssignment.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
        plannedHours: input.plannedHours,
      },
    });
  }

  findEntries(orgId: string) {
    return this.prisma.timeEntry.findMany({
      where: {
        user: {
          orgId,
        },
      },
      orderBy: { date: "desc" },
      include: {
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async createEntry(
    input: { taskId: string; userId: string; date: string; hours: number; note?: string },
    actor: AuthUser,
  ) {
    if (actor.role === "member" && actor.userId !== input.userId) {
      throw new ForbiddenException("Members can only create entries for themselves");
    }

    const [targetTask, targetUser] = await Promise.all([
      this.prisma.task.findUnique({
        where: { id: input.taskId },
        select: {
          project: {
            select: { orgId: true },
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { orgId: true },
      }),
    ]);

    if (!targetTask || !targetUser) {
      throw new ForbiddenException("Invalid task or user");
    }

    if (targetTask.project.orgId !== actor.orgId || targetUser.orgId !== actor.orgId) {
      throw new ForbiddenException("Cross organization entries are not allowed");
    }

    return this.prisma.timeEntry.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
        date: new Date(input.date),
        hours: input.hours,
        note: input.note,
      },
    });
  }

  async updateAssignmentStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
    orgId: string,
  ) {
    const assignment = await this.prisma.taskAssignment.findUnique({
      where: { id },
      select: {
        task: {
          select: {
            project: {
              select: { orgId: true },
            },
          },
        },
      },
    });

    if (!assignment || assignment.task.project.orgId !== orgId) {
      throw new ForbiddenException("Assignment not found in organization");
    }

    return this.prisma.taskAssignment.update({
      where: { id },
      data: { status },
    });
  }
}
