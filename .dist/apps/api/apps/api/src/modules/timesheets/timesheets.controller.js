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
exports.TimesheetsController = void 0;
const common_1 = require("@nestjs/common");
const timesheets_service_1 = require("./timesheets.service");
const roles_decorator_1 = require("../../common/auth/roles.decorator");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
let TimesheetsController = class TimesheetsController {
    service;
    constructor(service) {
        this.service = service;
    }
    listAssignments(user) {
        return this.service.findAssignments(user.orgId);
    }
    listUsers(user) {
        return this.service.findUsers(user.orgId);
    }
    listTasks(user) {
        return this.service.findTasks(user.orgId);
    }
    createAssignment(payload, user) {
        return this.service.createAssignment(payload, user);
    }
    listEntries(user) {
        return this.service.findEntries(user.orgId);
    }
    createEntry(payload, user) {
        return this.service.createEntry(payload, user);
    }
    approve(id, user) {
        return this.service.updateAssignmentStatus(id, "approved", user.orgId);
    }
};
exports.TimesheetsController = TimesheetsController;
__decorate([
    (0, common_1.Get)("assignments"),
    (0, roles_decorator_1.Roles)("owner", "manager", "member"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "listAssignments", null);
__decorate([
    (0, common_1.Get)("users"),
    (0, roles_decorator_1.Roles)("owner", "manager", "member"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)("tasks"),
    (0, roles_decorator_1.Roles)("owner", "manager", "member"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Post)("assignments"),
    (0, roles_decorator_1.Roles)("owner", "manager"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "createAssignment", null);
__decorate([
    (0, common_1.Get)("entries"),
    (0, roles_decorator_1.Roles)("owner", "manager", "member"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "listEntries", null);
__decorate([
    (0, common_1.Post)("entries"),
    (0, roles_decorator_1.Roles)("owner", "manager", "member"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "createEntry", null);
__decorate([
    (0, common_1.Post)("assignments/:id/approve"),
    (0, roles_decorator_1.Roles)("owner", "manager"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "approve", null);
exports.TimesheetsController = TimesheetsController = __decorate([
    (0, common_1.Controller)("timesheets"),
    __metadata("design:paramtypes", [timesheets_service_1.TimesheetsService])
], TimesheetsController);
