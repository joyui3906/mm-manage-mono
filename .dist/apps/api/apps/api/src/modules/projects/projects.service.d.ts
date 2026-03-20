export declare class ProjectsService {
    private readonly prisma;
    findAll(orgId: string): import("@prisma/client").Prisma.PrismaPromise<{
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
    findById(projectId: string, orgId: string): Promise<{
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
    create(input: {
        name: string;
        code: string;
        ownerUserId?: string;
        orgId?: string;
        budgetHours?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<{
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
    findTasksByProject(projectId: string, orgId: string): Promise<({
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
    createTask(projectId: string, input: {
        title: string;
        plannedHours?: number;
        dueDate?: string;
    }, orgId: string): Promise<{
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
