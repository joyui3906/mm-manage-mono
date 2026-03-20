export declare class DashboardService {
    private readonly prisma;
    getKpi(orgId?: string): Promise<{
        projectProgress: number;
        activeAssignments: number;
        pendingAssignments: number;
        totalTasks: number;
        doneTasks: number;
    }>;
}
