import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { getPrismaClient } from "@mm/prisma";
import { AuthUser } from "../../common/types/current-user";
import { AuditService } from "../audit/audit.service";
import { assertInjectedDependency } from "../../common/di/assert";

type ExportResource = "entries" | "assignments";
type CsvRow = string[];

@Injectable()
export class TimesheetsService {
  private readonly prisma = getPrismaClient();

  constructor(@Inject(AuditService) private readonly auditService: AuditService) {
    assertInjectedDependency(auditService, TimesheetsService.name, "AuditService");
  }

  private readonly exportHeaders = {
    entries: [
      "createdAt",
      "date",
      "userId",
      "userName",
      "userEmail",
      "projectCode",
      "projectName",
      "taskId",
      "taskTitle",
      "hours",
      "note",
    ],
    assignments: [
      "createdAt",
      "status",
      "taskId",
      "taskTitle",
      "projectCode",
      "projectName",
      "userId",
      "userName",
      "userEmail",
      "plannedHours",
    ],
  } as const;

  private escapeCsv(value: string): string {
    const raw = value ?? "";
    if (!raw.includes('"') && !raw.includes(",") && !raw.includes("\n")) {
      return raw;
    }
    return `"${raw.replace(/"/g, '""')}"`;
  }

  private toCsv(headers: readonly string[], rows: CsvRow[]): string {
    const rowToLine = (row: CsvRow) => row.map((cell) => this.escapeCsv(cell)).join(",");
    return `\uFEFF${[headers.join(","), ...rows.map(rowToLine)].join("\r\n")}\r\n`;
  }

  private buildScopes(orgId: string, teamId?: string) {
    const projectFilter = teamId ? { orgId, teamId } : { orgId };

    return {
      taskScope: {
        task: {
          project: projectFilter,
        },
      },
      entryScope: {
        user: {
          orgId,
        },
        task: {
          project: projectFilter,
        },
      },
    };
  }

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
      where: {
        orgId,
        isActive: true,
      },
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

  async exportCsv(resource: ExportResource, actor: AuthUser, teamId?: string) {
    const { taskScope, entryScope } = this.buildScopes(actor.orgId, teamId);

    if (resource === "assignments") {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: taskScope,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              project: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const rows: CsvRow[] = assignments.map((assignment) => [
        assignment.createdAt.toISOString(),
        assignment.status,
        assignment.taskId,
        assignment.task.title,
        assignment.task.project.code,
        assignment.task.project.name,
        assignment.user.id,
        assignment.user.name,
        assignment.user.email,
        String(assignment.plannedHours),
      ]);

      return this.toCsv(this.exportHeaders.assignments, rows);
    }

    const entries = await this.prisma.timeEntry.findMany({
      where: entryScope,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    const rows: CsvRow[] = entries.map((entry) => [
      entry.createdAt.toISOString(),
      entry.date.toISOString(),
      entry.user.id,
      entry.user.name,
      entry.user.email,
      entry.task.project.code,
      entry.task.project.name,
      entry.taskId,
      entry.task.title,
      String(entry.hours),
      entry.note ?? "",
    ]);

    return this.toCsv(this.exportHeaders.entries, rows);
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
        select: { orgId: true, isActive: true },
      }),
    ]);

    if (!targetTask || !targetUser) {
      throw new ForbiddenException("Invalid task or user");
    }

    if (!targetUser.isActive || targetTask.project.orgId !== actor.orgId || targetUser.orgId !== actor.orgId) {
      throw new ForbiddenException("Cross organization assignment is not allowed");
    }

    const assignment = await this.prisma.taskAssignment.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
        plannedHours: input.plannedHours,
      },
    });

    await this.auditService.record({
      orgId: actor.orgId,
      actorUserId: actor.userId,
      action: "assignment.create",
      resource: "assignment",
      resourceId: assignment.id,
      afterState: {
        id: assignment.id,
        taskId: assignment.taskId,
        userId: assignment.userId,
        status: assignment.status,
        plannedHours: assignment.plannedHours,
      },
      metadata: {
        reason: input.reason,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return assignment;
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
        select: { orgId: true, isActive: true },
      }),
    ]);

    if (!targetTask || !targetUser || !targetUser.isActive) {
      throw new ForbiddenException("Invalid task or user");
    }

    if (targetTask.project.orgId !== actor.orgId || targetUser.orgId !== actor.orgId) {
      throw new ForbiddenException("Cross organization entries are not allowed");
    }

    const entry = await this.prisma.timeEntry.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
        date: new Date(input.date),
        hours: input.hours,
        note: input.note,
      },
    });

    await this.auditService.record({
      orgId: actor.orgId,
      actorUserId: actor.userId,
      action: "timesheet.entry.create",
      resource: "time_entry",
      resourceId: entry.id,
      afterState: {
        id: entry.id,
        taskId: entry.taskId,
        userId: entry.userId,
        date: entry.date,
        hours: entry.hours,
      },
      metadata: {
        note: entry.note,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return entry;
  }

  async updateAssignmentStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
    actor: AuthUser,
  ) {
    const assignment = await this.prisma.taskAssignment.findUnique({
      where: { id },
      select: {
        id: true,
        taskId: true,
        status: true,
        userId: true,
        task: {
          select: {
            project: {
              select: { orgId: true },
            },
          },
        },
      },
    });

    if (!assignment || assignment.task.project.orgId !== actor.orgId) {
      throw new ForbiddenException("Assignment not found in organization");
    }

    if (actor.role === "member" && assignment.userId !== actor.userId) {
      throw new ForbiddenException("Members can only update their own assignment status");
    }

    const updated = await this.prisma.taskAssignment.update({
      where: { id },
      data: { status },
    });

    await this.auditService.record({
      orgId: actor.orgId,
      actorUserId: actor.userId,
      action: `assignment.${status}`,
      resource: "assignment",
      resourceId: assignment.id,
      beforeState: {
        id: assignment.id,
        taskId: assignment.taskId,
        userId: assignment.userId,
        status: assignment.status,
      },
      afterState: {
        id: updated.id,
        taskId: updated.taskId,
        userId: updated.userId,
        status: updated.status,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return updated;
  }

  async cancelAssignment(id: string, actor: AuthUser) {
    const assignment = await this.prisma.taskAssignment.findUnique({
      where: { id },
      select: {
        id: true,
        taskId: true,
        userId: true,
        status: true,
        task: {
          select: {
            project: {
              select: { orgId: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }

    if (assignment.task.project.orgId !== actor.orgId) {
      throw new ForbiddenException("Assignment not found in organization");
    }

    if (assignment.status !== "pending") {
      throw new ForbiddenException("Only pending assignments can be canceled");
    }

    if (actor.role === "member" && assignment.userId !== actor.userId) {
      throw new ForbiddenException("Members can only cancel their own assignments");
    }

    const updated = await this.prisma.taskAssignment.update({
      where: { id },
      data: { status: "rejected" },
    });

    await this.auditService.record({
      orgId: actor.orgId,
      actorUserId: actor.userId,
      action: "assignment.cancel",
      resource: "assignment",
      resourceId: assignment.id,
      beforeState: {
        id: assignment.id,
        taskId: assignment.taskId,
        userId: assignment.userId,
        status: assignment.status,
      },
      afterState: {
        id: updated.id,
        taskId: updated.taskId,
        userId: updated.userId,
        status: updated.status,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return updated;
  }
}
