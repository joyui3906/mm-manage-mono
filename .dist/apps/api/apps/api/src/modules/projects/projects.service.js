"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("@mm/prisma");
let ProjectsService = class ProjectsService {
    prisma = (0, prisma_1.getPrismaClient)();
    findAll(orgId) {
        return this.prisma.project.findMany({
            orderBy: {
                createdAt: "desc",
            },
            where: { orgId },
        });
    }
    async findById(projectId, orgId) {
        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                orgId,
            },
            include: {
                tasks: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        return project;
    }
    async create(input) {
        const orgId = input.orgId ?? "seed-org-id";
        const ownerUserId = input.ownerUserId ?? "dev-user";
        await this.prisma.organization.upsert({
            where: { id: orgId },
            create: {
                id: orgId,
                name: "Seed Organization",
            },
            update: {},
        });
        await this.prisma.user.upsert({
            where: { id: ownerUserId },
            create: {
                id: ownerUserId,
                orgId,
                email: `${ownerUserId}@demo.local`,
                name: ownerUserId,
                role: "manager",
                skills: [],
                isActive: true,
            },
            update: {
                orgId,
            },
        });
        const payload = {
            orgId,
            name: input.name,
            code: input.code,
            ownerUserId,
            budgetHours: input.budgetHours ?? 0,
            startDate: input.startDate ? new Date(input.startDate) : undefined,
            endDate: input.endDate ? new Date(input.endDate) : undefined,
            status: "planning",
        };
        return this.prisma.project.create({ data: payload });
    }
    async findTasksByProject(projectId, orgId) {
        return this.prisma.task.findMany({
            where: {
                projectId,
                project: {
                    orgId,
                },
            },
            include: {
                assignments: {
                    include: { user: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async createTask(projectId, input, orgId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { orgId: true },
        });
        if (!project || project.orgId !== orgId) {
            throw new common_1.ForbiddenException("Cannot create task for this project");
        }
        return this.prisma.task.create({
            data: {
                projectId,
                title: input.title,
                plannedHours: input.plannedHours ?? 0,
                dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            },
            include: { assignments: true },
        });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)()
], ProjectsService);
