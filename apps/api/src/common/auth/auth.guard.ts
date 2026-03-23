import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleEnum } from "@mm/shared";
import { getPrismaClient } from "@mm/prisma";
import { IS_PUBLIC_KEY } from "./roles.decorator";
import { AuthenticatedRequest } from "../types/current-user";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const prisma = getPrismaClient();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headers = request.headers ?? {};

    const defaultUserId =
      process.env.MM_DEFAULT_USER_ID ?? process.env.MM_DEMO_USER_ID ?? "dev-user";
    const defaultOrgId =
      process.env.MM_DEFAULT_ORG_ID ?? process.env.MM_DEMO_ORG_ID ?? "seed-org-id";
    const defaultRole =
      process.env.MM_DEFAULT_USER_ROLE ?? process.env.MM_DEMO_USER_ROLE ?? "member";

    const userId = this.extractHeaderValue(headers["x-user-id"]) ?? defaultUserId;
    const orgId = this.extractHeaderValue(headers["x-org-id"]) ?? defaultOrgId;
    const roleValue = this.extractHeaderValue(headers["x-user-role"]) ?? defaultRole;

    const roleParse = RoleEnum.safeParse(roleValue);
    if (!roleParse.success) {
      throw new UnauthorizedException("x-user-role is invalid");
    }

    if (!userId) {
      if (process.env.NODE_ENV === "production") {
        throw new UnauthorizedException("x-user-id header is required");
      }

      request.user = {
        userId: defaultUserId,
        orgId,
        role: roleParse.data,
      };
      return true;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        orgId: true,
        isActive: true,
        role: true,
      },
    });

    if (!user) {
      if (process.env.NODE_ENV === "production") {
        throw new UnauthorizedException("Unknown user");
      }

      request.user = {
        userId,
        orgId,
        role: roleParse.data,
      };
      return true;
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Inactive user");
    }

    if (user.orgId !== orgId) {
      throw new UnauthorizedException("Organization mismatch");
    }

    request.user = {
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
    };
    return true;
  }

  private extractHeaderValue(headerValue: string | string[] | undefined): string | undefined {
    if (!headerValue) return undefined;
    if (Array.isArray(headerValue)) return headerValue[0]?.trim();
    return headerValue.trim();
  }
}
