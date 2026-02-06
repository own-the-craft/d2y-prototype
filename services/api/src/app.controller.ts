import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("system")
@Controller()
export class AppController {
  @Get()
  root() {
    return { ok: true, name: "d2y-api" };
  }

  @Get("health")
  health() {
    return { ok: true };
  }
}
