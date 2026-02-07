import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthUser } from "../common/types/auth-user";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-status.dto";
import { RefundDto } from "./dto/refund.dto";

@ApiTags("orders")
@ApiBearerAuth()
@Controller()
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiHeader({ name: "Idempotency-Key", required: false })
  @Post("orders")
  create(
    @Req() req: Request,
    @Body() dto: CreateOrderDto,
    @Headers("idempotency-key") idem?: string,
  ) {
    return this.orders.createOrder(req.user as AuthUser, dto, idem);
  }

  @UseGuards(JwtAuthGuard)
  @Get("orders")
  list(@Req() req: Request, @Query("q") q?: string) {
    return this.orders.listOrders(req.user as AuthUser, q);
  }

  @UseGuards(JwtAuthGuard)
  @Get("orders/:id")
  detail(@Req() req: Request, @Param("id") id: string) {
    return this.orders.getOrder(req.user as AuthUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("orders/:id/events")
  events(@Req() req: Request, @Param("id") id: string) {
    return this.orders.getOrderEvents(req.user as AuthUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("orders/:id/pay")
  pay(@Req() req: Request, @Param("id") id: string) {
    return this.orders.payOrder(req.user as AuthUser, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN, Role.SUPPORT)
  @Post("orders/:id/status")
  status(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(req.user as AuthUser, id, dto.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  @Post("orders/:id/refund")
  refund(@Req() req: Request, @Param("id") id: string, @Body() dto: RefundDto) {
    return this.orders.refundOrder(req.user as AuthUser, id, dto.amountCents, dto.reason);
  }
}
