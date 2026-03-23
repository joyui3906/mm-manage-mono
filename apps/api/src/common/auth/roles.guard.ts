import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@mm/shared";
import { IS_PUBLIC_KEY, ROLES_KEY } from "./roles.decorator";
import { AuthenticatedRequest } from "../types/current-user";

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly reflector = new Reflector();

  canActivate(context: ExecutionContext): boolean {
    const reflector = this.getReflector();
    const requiredRoles = reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [];
    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (this.isSwaggerRequest(request)) {
      return true;
    }

    if (isPublic || requiredRoles.length === 0) {
      return true;
    }

    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Authentication required");
    }

    const hasPermission = requiredRoles.includes(user.role);
    if (!hasPermission) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }

  private getReflector(): Reflector {
    return this.reflector;
  }

  private isSwaggerRequest(request: AuthenticatedRequest): boolean {
    const requestUrl = typeof request["url"] === "string" ? String(request["url"]) : "";
    const path = requestUrl.split("?")[0];
    return path.startsWith("/api/docs") || path.startsWith("/api/docs-json");
  }
}
