import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../common/types/auth-user";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get("merchants")
  async merchants(@Req() req: Request) {
    const user = req.user as AuthUser;
    const includeInactive = user.role === Role.ADMIN || user.role === Role.SUPPORT;
    return this.catalog.listMerchants(includeInactive);
  }

  @Get("merchants/:id/products")
  async products(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as AuthUser;
    const onlyInStock = user.role === Role.CONSUMER; // consumer ziet alleen in-stock
    return this.catalog.listProducts(id, onlyInStock);
  }
}
