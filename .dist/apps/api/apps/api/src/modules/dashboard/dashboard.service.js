"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("@mm/prisma");
let DashboardService = class DashboardService {
    prisma = (0, prisma_1.getPrismaClient)();
    async getKpi(orgId) {
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)()
], DashboardService);
