import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { parseBearerToken } from "@mm/shared";
import { RoleEnum } from "@mm/shared";
import { getPrismaClient } from "@mm/prisma";
import { IS_PUBLIC_KEY } from "./roles.decorator";
import { AuthenticatedRequest } from "../types/current-user";
import { verifyAuthToken } from "./token";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly reflector = new Reflector();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const prisma = getPrismaClient();
    const reflector = this.getReflector();
    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (this.isSwaggerRequest(request)) {
      return true;
    }

    if (isPublic) {
      return true;
    }

    const headers = request.headers ?? {};

    const defaultUserId =
      process.env.MM_DEFAULT_USER_ID ?? process.env.MM_DEMO_USER_ID ?? "dev-user";
    const defaultOrgId =
      process.env.MM_DEFAULT_ORG_ID ?? process.env.MM_DEMO_ORG_ID ?? "seed-org-id";
    const defaultRole =
      process.env.MM_DEFAULT_USER_ROLE ?? process.env.MM_DEMO_USER_ROLE ?? "member";

    const token = parseBearerToken(this.extractHeaderValue(headers["authorization"]));
    const tokenPayload = token
      ? verifyAuthToken(token, { secret: process.env.MM_JWT_SECRET ?? "mm_jwt_dev_secret" })
      : undefined;

    const userId = tokenPayload?.userId ?? this.extractHeaderValue(headers["x-user-id"]) ?? this.extractHeaderValue(headers["x-mm-user-id"]) ?? defaultUserId;
    const orgId = tokenPayload?.orgId ?? this.extractHeaderValue(headers["x-org-id"]) ?? this.extractHeaderValue(headers["x-mm-org-id"]) ?? defaultOrgId;
    const roleFromToken = tokenPayload?.role;
    const roleHeader =
      this.extractHeaderValue(headers["x-user-role"]) ?? this.extractHeaderValue(headers["x-mm-user-role"]) ?? defaultRole;
    const roleValue = roleFromToken ?? roleHeader;

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
        ipAddress: this.getRequestIp(request),
        userAgent: this.getRequestUserAgent(request),
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
        ipAddress: this.getRequestIp(request),
        userAgent: this.getRequestUserAgent(request),
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
      ipAddress: this.getRequestIp(request),
      userAgent: this.getRequestUserAgent(request),
    };
    return true;
  }

  private getRequestIp(request: AuthenticatedRequest): string | undefined {
    const socketIp = request.socket?.remoteAddress;
    const requestIp = request.ip;

    if (typeof requestIp === "string" && requestIp.trim()) {
      return requestIp.trim();
    }

    if (typeof socketIp === "string" && socketIp.trim()) {
      return socketIp.trim();
    }

    return undefined;
  }

  private getRequestUserAgent(request: AuthenticatedRequest): string | undefined {
    return this.extractHeaderValue(request.headers["user-agent"]);
  }

  private extractHeaderValue(headerValue: string | string[] | undefined): string | undefined {
    if (!headerValue) return undefined;
    if (Array.isArray(headerValue)) return headerValue[0]?.trim();
    return headerValue.trim();
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
