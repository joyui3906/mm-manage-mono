import { Module } from "@nestjs/common";
import { TimesheetsController } from "./timesheets.controller";
import { TimesheetsService } from "./timesheets.service";
import { AuditService } from "../audit/audit.service";

@Module({
  controllers: [TimesheetsController],
  providers: [TimesheetsService, AuditService],
})
export class TimesheetsModule {}
