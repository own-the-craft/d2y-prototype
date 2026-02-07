import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role, TicketStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeService } from "../realtime/realtime.service";
import { AuthUser } from "../common/types/auth-user";
import { CreateTicketDto } from "./dto/create-ticket.dto";

function isAdminLike(role: Role) {
  return role === Role.ADMIN || role === Role.SUPPORT;
}

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  async createTicket(user: AuthUser, dto: CreateTicketDto) {
    if (user.role !== Role.CONSUMER) throw new ForbiddenException("only_consumer");

    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { id: true, consumerId: true, merchantId: true },
      });
      if (!order) throw new NotFoundException("order_not_found");
      if (order.consumerId !== user.id) throw new ForbiddenException("forbidden");
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        consumerId: user.id,
        orderId: dto.orderId,
        subject: dto.subject,
        message: dto.message,
        status: TicketStatus.OPEN,
      },
      select: {
        id: true,
        orderId: true,
        consumerId: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.realtime.emitAdmin("ticket.created", ticket);
    if (ticket.orderId) this.realtime.emitOrder(ticket.orderId, "ticket.created", ticket);

    return ticket;
  }

  async listTickets(user: AuthUser) {
    if (!isAdminLike(user.role)) throw new ForbiddenException("only_admin_support");

    return this.prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        orderId: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        consumer: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async updateStatus(user: AuthUser, ticketId: string, status: TicketStatus) {
    if (!isAdminLike(user.role)) throw new ForbiddenException("only_admin_support");

    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
      select: {
        id: true,
        orderId: true,
        subject: true,
        status: true,
        updatedAt: true,
      },
    });

    return ticket;
  }
}
