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

type MonthlyUtilizationItem = {
  userId: string;
  name: string;
  email: string;
  assignedHours: number;
  capacityHours: number;
  utilizationPercent: number;
  isOverCapacity: boolean;
};

@Injectable()
export class DashboardService {
  private readonly prisma = getPrismaClient();

  async getKpi(orgId: string, month?: string) {
    const targetOrgId = orgId;
    const overloadThreshold = Number(process.env.MM_DASHBOARD_OVERLOAD_HOURS ?? 160);
    const monthRange = month ? parseMonthToRange(month) : undefined;

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
      usersInOrg,
      monthlyAssignedHours,
      monthlyCapacityHours,
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
      this.prisma.user.findMany({
        where: { orgId: targetOrgId },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.timeEntry.groupBy({
        by: ["userId"],
        where: {
          ...(!monthRange
            ? {
                task: {
                  project: {
                    orgId: targetOrgId,
                  },
                },
              }
            : {
                task: {
                  project: {
                    orgId: targetOrgId,
                  },
                },
                date: monthRange,
              }),
        },
        _sum: {
          hours: true,
        },
      }),
      this.prisma.userAvailability.groupBy({
        by: ["userId"],
        where: {
          user: {
            orgId: targetOrgId,
          },
          ...(monthRange ? { date: monthRange } : {}),
        },
        _sum: {
          capacity: true,
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

    const monthlyUtilization: MonthlyUtilizationItem[] = usersInOrg.map((user) => {
      const assigned = monthlyAssignedHours.find((row) => row.userId === user.id);
      const capacity = monthlyCapacityHours.find((row) => row.userId === user.id);
      const assignedHours = Number(assigned?._sum.hours ?? 0);
      const capacityHours = Number(capacity?._sum.capacity ?? 0);
      const utilizationPercent = capacityHours > 0 ? Math.round((assignedHours / capacityHours) * 100) : 0;
      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        assignedHours,
        capacityHours,
        utilizationPercent,
        isOverCapacity: capacityHours > 0 && assignedHours > capacityHours,
      };
    });

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
      month: month ?? currentMonth(),
      monthlyUtilization: monthlyUtilization.sort((a, b) => {
        if (b.utilizationPercent !== a.utilizationPercent) {
          return b.utilizationPercent - a.utilizationPercent;
        }
        return b.assignedHours - a.assignedHours;
      }),
    };
  }
}

function parseMonthToRange(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));
  return { gte: start, lt: end };
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
