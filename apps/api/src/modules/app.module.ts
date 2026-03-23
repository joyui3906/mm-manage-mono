import { APP_GUARD } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ProjectsModule } from "./projects/projects.module";
import { TimesheetsModule } from "./timesheets/timesheets.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { AuditModule } from "./audit/audit.module";
import { AvailabilityModule } from "./availability/availability.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { AuthGuard } from "../common/auth/auth.guard";
import { RolesGuard } from "../common/auth/roles.guard";

@Module({
  imports: [
    HealthModule,
    ProjectsModule,
    TimesheetsModule,
    DashboardModule,
    AuditModule,
    AvailabilityModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
