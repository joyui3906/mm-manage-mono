import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { Roles } from "../../common/auth/roles.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthUser } from "../../common/types/current-user";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get("kpi")
  @Roles("owner", "manager", "member")
  kpi(@Query("orgId") orgId: string | undefined, @CurrentUser() user: AuthUser) {
    return this.service.getKpi(orgId ?? user.orgId);
  }
}
