"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("@mm/prisma");
let TimesheetsService = class TimesheetsService {
    prisma = (0, prisma_1.getPrismaClient)();
    findAssignments(orgId) {
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
    findUsers(orgId) {
        return this.prisma.user.findMany({
            where: { orgId },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: { name: "asc" },
        });
    }
    findTasks(orgId) {
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
    async createAssignment(input, actor) {
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
                select: { orgId: true },
            }),
        ]);
        if (!targetTask || !targetUser) {
            throw new common_1.ForbiddenException("Invalid task or user");
        }
        if (targetTask.project.orgId !== actor.orgId || targetUser.orgId !== actor.orgId) {
            throw new common_1.ForbiddenException("Cross organization assignment is not allowed");
        }
        return this.prisma.taskAssignment.create({
            data: {
                taskId: input.taskId,
                userId: input.userId,
                plannedHours: input.plannedHours,
            },
        });
    }
    findEntries(orgId) {
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
    async createEntry(input, actor) {
        if (actor.role === "member" && actor.userId !== input.userId) {
            throw new common_1.ForbiddenException("Members can only create entries for themselves");
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
                select: { orgId: true },
            }),
        ]);
        if (!targetTask || !targetUser) {
            throw new common_1.ForbiddenException("Invalid task or user");
        }
        if (targetTask.project.orgId !== actor.orgId || targetUser.orgId !== actor.orgId) {
            throw new common_1.ForbiddenException("Cross organization entries are not allowed");
        }
        return this.prisma.timeEntry.create({
            data: {
                taskId: input.taskId,
                userId: input.userId,
                date: new Date(input.date),
                hours: input.hours,
                note: input.note,
            },
        });
    }
    async updateAssignmentStatus(id, status, orgId) {
        const assignment = await this.prisma.taskAssignment.findUnique({
            where: { id },
            select: {
                task: {
                    select: {
                        project: {
                            select: { orgId: true },
                        },
                    },
                },
            },
        });
        if (!assignment || assignment.task.project.orgId !== orgId) {
            throw new common_1.ForbiddenException("Assignment not found in organization");
        }
        return this.prisma.taskAssignment.update({
            where: { id },
            data: { status },
        });
    }
};
exports.TimesheetsService = TimesheetsService;
exports.TimesheetsService = TimesheetsService = __decorate([
    (0, common_1.Injectable)()
], TimesheetsService);
