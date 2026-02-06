import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../common/types/auth-user";
import { GetSlotsDto } from "./dto/get-slots.dto";
import { SlotsService } from "./slots.service";

@ApiTags("slots")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SlotsController {
  constructor(private slots: SlotsService) {}

  @Get("slots")
  async getSlots(@Req() req: Request, @Query() query: GetSlotsDto) {
    const user = req.user as AuthUser;

    // Consumers zien alleen slots die nog ruimte hebben
    const onlyAvailable = user.role === Role.CONSUMER;

    return this.slots.listSlots(query.date, query.type, onlyAvailable);
  }
}
