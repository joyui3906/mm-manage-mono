"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const projects_service_1 = require("./projects.service");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const roles_decorator_1 = require("../../common/auth/roles.decorator");
let ProjectsController = class ProjectsController {
    service;
    constructor(service) {
        this.service = service;
    }
    listProjects(user) {
        return this.service.findAll(user.orgId);
    }
    getProject(projectId, user) {
        return this.service.findById(projectId, user.orgId);
    }
    createProject(payload, user) {
        return this.service.create({
            ...payload,
            ownerUserId: payload.ownerUserId ?? user?.userId,
            orgId: user?.orgId,
        });
    }
    listTasks(projectId, user) {
        return this.service.findTasksByProject(projectId, user.orgId);
    }
    createTask(projectId, payload, user) {
        return this.service.createTask(projectId, payload, user.orgId);
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)("owner", "manager", "member"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "listProjects", null);
__decorate([
    (0, common_1.Get)(":projectId"),
    (0, roles_decorator_1.Roles)("owner", "manager", "member"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "getProject", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("owner", "manager"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "createProject", null);
__decorate([
    (0, common_1.Get)(":projectId/tasks"),
    (0, roles_decorator_1.Roles)("owner", "manager", "member"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Post)(":projectId/tasks"),
    (0, roles_decorator_1.Roles)("owner", "manager"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "createTask", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_1.Controller)("projects"),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
