import { AuthUser } from "../../common/types/current-user";
export declare class TimesheetsService {
    private readonly prisma;
    findAssignments(orgId: string): import("@prisma/client").Prisma.PrismaPromise<({
        task: {
            id: string;
            title: string;
        };
        user: {
            name: string;
            id: string;
            email: string;
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
    })[]>;
    findUsers(orgId: string): import("@prisma/client").Prisma.PrismaPromise<{
        name: string;
        id: string;
        email: string;
    }[]>;
    findTasks(orgId: string): import("@prisma/client").Prisma.PrismaPromise<{
        project: {
            name: string;
            id: string;
            code: string;
        };
        id: string;
        title: string;
        plannedHours: number;
        dueDate: Date | null;
    }[]>;
    createAssignment(input: {
        taskId: string;
        userId: string;
        plannedHours: number;
        reason?: string;
    }, actor: AuthUser): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.AssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        plannedHours: number;
        taskId: string;
        userId: string;
        actualHours: number;
    }>;
    findEntries(orgId: string): import("@prisma/client").Prisma.PrismaPromise<({
        task: {
            id: string;
            title: string;
        };
        user: {
            name: string;
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        taskId: string;
        userId: string;
        date: Date;
        hours: number;
        note: string | null;
    })[]>;
    createEntry(input: {
        taskId: string;
        userId: string;
        date: string;
        hours: number;
        note?: string;
    }, actor: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        taskId: string;
        userId: string;
        date: Date;
        hours: number;
        note: string | null;
    }>;
    updateAssignmentStatus(id: string, status: "pending" | "approved" | "rejected", orgId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.AssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        plannedHours: number;
        taskId: string;
        userId: string;
        actualHours: number;
    }>;
}
