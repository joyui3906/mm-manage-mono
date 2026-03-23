import { BadRequestException, Controller, Get, Inject, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { Roles } from "../../common/auth/roles.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthUser } from "../../common/types/current-user";
import { z } from "zod";
import { ApiTags } from "@nestjs/swagger";
import { assertInjectedDependency } from "../../common/di/assert";

const kpiQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
});

@Controller("dashboard")
@ApiTags("dashboard")
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly service: DashboardService) {
    assertInjectedDependency(service, DashboardController.name, "DashboardService");
  }

  @Get("kpi")
  @Roles("owner", "manager", "member")
  kpi(@Query() query: Record<string, string | string[] | undefined>, @CurrentUser() user: AuthUser) {
    const parsedMonth = normalizeQuery(query.month);
    const payload = kpiQuerySchema.safeParse({ month: parsedMonth });
    if (!payload.success) {
      throw new BadRequestException("Invalid dashboard query");
    }
    return this.service.getKpi(user.orgId, payload.data.month);
  }
}

function normalizeQuery(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}
