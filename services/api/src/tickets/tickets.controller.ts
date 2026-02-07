import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthUser } from "../common/types/auth-user";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketStatusDto } from "./dto/update-ticket-status.dto";
import { TicketsService } from "./tickets.service";

@ApiTags("tickets")
@ApiBearerAuth()
@Controller()
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSUMER)
  @Post("tickets")
  create(@Req() req: Request, @Body() dto: CreateTicketDto) {
    return this.tickets.createTicket(req.user as AuthUser, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  @Get("tickets")
  list(@Req() req: Request) {
    return this.tickets.listTickets(req.user as AuthUser);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  @Post("tickets/:id/status")
  update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.tickets.updateStatus(req.user as AuthUser, id, dto.status);
  }
}
