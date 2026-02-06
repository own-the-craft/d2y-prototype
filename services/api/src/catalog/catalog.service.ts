import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async listMerchants(includeInactive: boolean) {
    return this.prisma.merchant.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        addressJson: true,
        openingHoursJson: true,
        active: true,
      },
    });
  }

  async listProducts(merchantId: string, onlyInStock: boolean) {
    return this.prisma.product.findMany({
      where: {
        merchantId,
        ...(onlyInStock ? { inStockBool: true } : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        merchantId: true,
        name: true,
        description: true,
        priceCents: true,
        imageUrl: true,
        inStockBool: true,
        sku: true,
      },
    });
  }
}
