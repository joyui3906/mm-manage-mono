import type { Role } from "@mm/shared";
export interface AuthUser {
    userId: string;
    orgId: string;
    role: Role;
}
export type AuthenticatedRequest = {
    user?: AuthUser;
    headers: Record<string, string | string[] | undefined>;
    [key: string]: unknown;
};
