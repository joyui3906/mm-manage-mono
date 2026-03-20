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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const shared_1 = require("@mm/shared");
const roles_decorator_1 = require("./roles.decorator");
let AuthGuard = class AuthGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(roles_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const headers = request.headers ?? {};
        const defaultUserId = process.env.MM_DEFAULT_USER_ID ?? process.env.MM_DEMO_USER_ID ?? "dev-user";
        const defaultOrgId = process.env.MM_DEFAULT_ORG_ID ?? process.env.MM_DEMO_ORG_ID ?? "seed-org-id";
        const defaultRole = process.env.MM_DEFAULT_USER_ROLE ?? process.env.MM_DEMO_USER_ROLE ?? "member";
        const userId = this.extractHeaderValue(headers["x-user-id"]) ?? defaultUserId;
        const orgId = this.extractHeaderValue(headers["x-org-id"]) ?? defaultOrgId;
        const roleValue = this.extractHeaderValue(headers["x-user-role"]) ?? defaultRole;
        const roleParse = shared_1.RoleEnum.safeParse(roleValue);
        if (!roleParse.success) {
            throw new common_1.UnauthorizedException("x-user-role is invalid");
        }
        if (!userId) {
            if (process.env.NODE_ENV === "production") {
                throw new common_1.UnauthorizedException("x-user-id header is required");
            }
            request.user = {
                userId: defaultUserId,
                orgId,
                role: roleParse.data,
            };
            return true;
        }
        request.user = {
            userId,
            orgId,
            role: roleParse.data,
        };
        return true;
    }
    extractHeaderValue(headerValue) {
        if (!headerValue)
            return undefined;
        if (Array.isArray(headerValue))
            return headerValue[0]?.trim();
        return headerValue.trim();
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], AuthGuard);
