import type { Role } from "@mm/shared";
export declare const ROLES_KEY = "roles";
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
