import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/auth/roles.decorator";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return { ok: true, time: new Date().toISOString() };
  }
}
