import { TimesheetsService } from "./timesheets.service";
import { AuthUser } from "../../common/types/current-user";
type CreateAssignmentDto = {
    taskId: string;
    userId: string;
    plannedHours: number;
    reason?: string;
};
type CreateTimeEntryDto = {
    taskId: string;
    userId: string;
    date: string;
    hours: number;
    note?: string;
};
export declare class TimesheetsController {
    private readonly service;
    constructor(service: TimesheetsService);
    listAssignments(user: AuthUser): import("@prisma/client").Prisma.PrismaPromise<({
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
    listUsers(user: AuthUser): import("@prisma/client").Prisma.PrismaPromise<{
        name: string;
        id: string;
        email: string;
    }[]>;
    listTasks(user: AuthUser): import("@prisma/client").Prisma.PrismaPromise<{
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
    createAssignment(payload: CreateAssignmentDto, user: AuthUser): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.AssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        plannedHours: number;
        taskId: string;
        userId: string;
        actualHours: number;
    }>;
    listEntries(user: AuthUser): import("@prisma/client").Prisma.PrismaPromise<({
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
    createEntry(payload: CreateTimeEntryDto, user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        taskId: string;
        userId: string;
        date: Date;
        hours: number;
        note: string | null;
    }>;
    approve(id: string, user: AuthUser): Promise<{
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
export {};
