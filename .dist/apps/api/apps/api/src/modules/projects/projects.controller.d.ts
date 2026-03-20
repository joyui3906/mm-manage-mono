import { ProjectsService } from "./projects.service";
import { AuthUser } from "../../common/types/current-user";
type CreateProjectDto = {
    name: string;
    code: string;
    ownerUserId?: string;
    budgetHours?: number;
    startDate?: string;
    endDate?: string;
};
type CreateTaskDto = {
    projectId: string;
    title: string;
    plannedHours?: number;
    dueDate?: string;
};
export declare class ProjectsController {
    private readonly service;
    constructor(service: ProjectsService);
    listProjects(user: AuthUser): import("@prisma/client").Prisma.PrismaPromise<{
        name: string;
        id: string;
        orgId: string;
        code: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        budgetHours: number;
        startDate: Date | null;
        endDate: Date | null;
        ownerUserId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getProject(projectId: string, user: AuthUser): Promise<{
        tasks: {
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            title: string;
            description: string | null;
            plannedHours: number;
            dueDate: Date | null;
        }[];
    } & {
        name: string;
        id: string;
        orgId: string;
        code: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        budgetHours: number;
        startDate: Date | null;
        endDate: Date | null;
        ownerUserId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createProject(payload: CreateProjectDto, user: AuthUser): Promise<{
        name: string;
        id: string;
        orgId: string;
        code: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        budgetHours: number;
        startDate: Date | null;
        endDate: Date | null;
        ownerUserId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listTasks(projectId: string, user: AuthUser): Promise<({
        assignments: ({
            user: {
                name: string;
                id: string;
                orgId: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                role: import("@prisma/client").$Enums.Role;
                skills: string[];
                isActive: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.AssignmentStatus;
            createdAt: Date;
            updatedAt: Date;
            plannedHours: number;
            taskId: string;
            userId: string;
            actualHours: number;
        })[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        title: string;
        description: string | null;
        plannedHours: number;
        dueDate: Date | null;
    })[]>;
    createTask(projectId: string, payload: Omit<CreateTaskDto, "projectId">, user: AuthUser): Promise<{
        assignments: {
            id: string;
            status: import("@prisma/client").$Enums.AssignmentStatus;
            createdAt: Date;
            updatedAt: Date;
            plannedHours: number;
            taskId: string;
            userId: string;
            actualHours: number;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        title: string;
        description: string | null;
        plannedHours: number;
        dueDate: Date | null;
    }>;
}
export {};
