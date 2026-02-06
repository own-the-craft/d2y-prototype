import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SlotType } from "@prisma/client";

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async listSlots(date: string, type: SlotType, onlyAvailable: boolean) {
    return this.prisma.slot.findMany({
      where: {
        date,
        type,
        ...(onlyAvailable ? { remaining: { gt: 0 } } : {}),
      },
      orderBy: [{ startTime: "asc" }],
      select: {
        id: true,
        date: true,
        type: true,
        startTime: true,
        endTime: true,
        capacity: true,
        remaining: true,
      },
    });
  }
}
