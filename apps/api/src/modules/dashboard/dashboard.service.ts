import { Injectable } from "@nestjs/common";
import { getPrismaClient } from "@mm/prisma";

@Injectable()
export class DashboardService {
  private readonly prisma = getPrismaClient();

  async getKpi(orgId?: string) {
    const taskScope = orgId
      ? {
          project: {
            orgId,
          },
        }
      : undefined;
    const assignmentScope = orgId
      ? {
          task: {
            project: {
              orgId,
            },
          },
        }
      : undefined;

    const [totalTasks, doneTasks, activeAssignments, pendingAssignments] = await Promise.all([
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
    ]);

    const utilization = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return {
      projectProgress: utilization,
      activeAssignments,
      pendingAssignments,
      totalTasks,
      doneTasks,
    };
  }
}
