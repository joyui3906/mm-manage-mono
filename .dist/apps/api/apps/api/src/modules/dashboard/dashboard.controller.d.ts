import { DashboardService } from "./dashboard.service";
import { AuthUser } from "../../common/types/current-user";
export declare class DashboardController {
    private readonly service;
    constructor(service: DashboardService);
    kpi(orgId: string | undefined, user: AuthUser): Promise<{
        projectProgress: number;
        activeAssignments: number;
        pendingAssignments: number;
        totalTasks: number;
        doneTasks: number;
    }>;
}
