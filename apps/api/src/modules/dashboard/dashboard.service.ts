import { Injectable } from "@nestjs/common";
import { getPrismaClient } from "@mm/prisma";

type AssignmentAlert = {
  userId: string;
  name: string;
  email: string;
  plannedHours: number;
  threshold: number;
};

type UnassignedTaskAlert = {
  taskId: string;
  taskTitle: string;
  projectCode: string;
  projectName: string;
};

@Injectable()
export class DashboardService {
  private readonly prisma = getPrismaClient();

  async getKpi(orgId?: string) {
    const targetOrgId = orgId ?? "seed-org-id";
    const overloadThreshold = Number(process.env.MM_DASHBOARD_OVERLOAD_HOURS ?? 160);

    const taskScope = {
      project: {
        orgId: targetOrgId,
      },
    };
    const assignmentScope = {
      task: {
        project: {
          orgId: targetOrgId,
        },
      },
    };

    const [
      totalTasks,
      doneTasks,
      activeAssignments,
      pendingAssignments,
      unassignedTasks,
      assignmentTotalsByUser,
    ] = await Promise.all([
      this.prisma.task.count({
        where: taskScope,
      }),
      this.prisma.task.count({
        where: {
          ...taskScope,
          status: "done",
        },
      }),
      this.prisma.taskAssignment.count({
        where: {
          ...assignmentScope,
          status: "approved",
        },
      }),
      this.prisma.taskAssignment.count({
        where: {
          ...assignmentScope,
          status: "pending",
        },
      }),
      this.prisma.task.count({
        where: {
          ...taskScope,
          status: { not: "done" },
          assignments: {
            none: {},
          },
        },
      }),
      this.prisma.taskAssignment.groupBy({
        by: ["userId"],
        where: assignmentScope,
        _sum: {
          plannedHours: true,
        },
      }),
    ]);

    const utilization = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const overloadedUserIds = assignmentTotalsByUser
      .filter((row) => (row._sum.plannedHours ?? 0) > overloadThreshold)
      .map((row) => row.userId);

    const [overloadedUsers, unassignedExamples] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: overloadedUserIds } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.task.findMany({
        where: {
          ...taskScope,
          status: { not: "done" },
          assignments: {
            none: {},
          },
        },
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
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const overloaded = overloadedUsers
      .map((user) => {
        const target = assignmentTotalsByUser.find((row) => row.userId === user.id);
        const plannedHours = target?._sum.plannedHours ?? 0;
        if (plannedHours <= overloadThreshold) {
          return null;
        }

        const alert: AssignmentAlert = {
          userId: user.id,
          name: user.name,
          email: user.email,
          plannedHours,
          threshold: overloadThreshold,
        };
        return alert;
      })
      .filter(Boolean) as AssignmentAlert[];

    const unassigned: UnassignedTaskAlert[] = unassignedExamples.map((task) => ({
      taskId: task.id,
      taskTitle: task.title,
      projectCode: task.project.code,
      projectName: task.project.name,
    }));

    return {
      projectProgress: utilization,
      activeAssignments,
      pendingAssignments,
      totalTasks,
      doneTasks,
      unassignedTasks,
      overloadedCount: overloaded.length,
      overloadedUsers: overloaded,
      unassignedTasksList: unassigned,
    };
  }
}
