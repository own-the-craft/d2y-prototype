import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, PaymentStatus, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeService } from "../realtime/realtime.service";
import { AuthUser } from "../common/types/auth-user";
import { CreateOrderDto } from "./dto/create-order.dto";

const orderListSelect = {
  id: true,
  orderCode: true,
  status: true,
  paymentStatus: true,
  createdAt: true,
  totalsJson: true,
  merchant: { select: { id: true, name: true } },
  consumer: { select: { id: true, email: true, name: true } },
  slot: { select: { id: true, date: true, type: true, startTime: true, endTime: true } },
};

const orderDetailSelect = {
  ...orderListSelect,
  addressJson: true,
  instructions: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      nameSnapshot: true,
      unitPriceCents: true,
      qty: true,
    },
  },
};

function isAdminLike(role: Role) {
  return role === Role.ADMIN || role === Role.SUPPORT;
}

function canAccessOrder(user: AuthUser, order: { consumerId: string; merchantId: string }) {
  if (isAdminLike(user.role)) return true;
  if (user.role === Role.CONSUMER) return order.consumerId === user.id;
  if (user.role === Role.MERCHANT) return !!user.merchantId && order.merchantId === user.merchantId;
  return false;
}

const merchantNext: Record<OrderStatus, OrderStatus[]> = {
  PLACED: [],
  PAID: ["ACCEPTED"],
  ACCEPTED: ["PACKING"],
  PACKING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: [],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  private async generateOrderCode(tx: PrismaService) {
    for (let i = 0; i < 5; i++) {
      const n = Math.floor(100000 + Math.random() * 900000);
      const code = `D2Y${n}`;
      const exists = await tx.order.findUnique({ where: { orderCode: code }, select: { id: true } });
      if (!exists) return code;
    }
    throw new BadRequestException("could_not_generate_order_code");
  }

  async listOrders(user: AuthUser, q?: string) {
    const where: any = {};
    if (user.role === Role.CONSUMER) where.consumerId = user.id;
    if (user.role === Role.MERCHANT) where.merchantId = user.merchantId ?? "__none__";
    // admin/support: no filter

    if (q) {
      where.orderCode = { contains: q, mode: "insensitive" };
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: orderListSelect,
    });
  }

  async getOrder(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { ...orderDetailSelect, consumerId: true, merchantId: true },
    });
    if (!order) throw new NotFoundException("order_not_found");
    if (!canAccessOrder(user, order)) throw new ForbiddenException("forbidden");
    // hide internal ids already included; OK for prototype
    return order;
  }

  async getOrderEvents(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, consumerId: true, merchantId: true },
    });
    if (!order) throw new NotFoundException("order_not_found");
    if (!canAccessOrder(user, order)) throw new ForbiddenException("forbidden");

    return this.prisma.orderEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: { id: true, type: true, payloadJson: true, createdAt: true, actorUserId: true },
    });
  }

  async createOrder(user: AuthUser, dto: CreateOrderDto, idempotencyKey?: string) {
    if (user.role !== Role.CONSUMER) throw new ForbiddenException("only_consumer_can_create_orders");
    const idem = idempotencyKey?.trim() || undefined;

    if (idem) {
      const existing = await this.prisma.order.findFirst({
        where: { consumerId: user.id, idempotencyKey: idem },
        select: orderDetailSelect,
      });
      if (existing) return existing;
    }

    // merge duplicate productIds
    const itemMap = new Map<string, number>();
    for (const it of dto.items) {
      itemMap.set(it.productId, (itemMap.get(it.productId) ?? 0) + it.qty);
    }
    const normalizedItems = Array.from(itemMap.entries()).map(([productId, qty]) => ({ productId, qty }));

    const result = await this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.findUnique({ where: { id: dto.merchantId }, select: { id: true, active: true } });
      if (!merchant || !merchant.active) throw new BadRequestException("merchant_not_found");

      const slot = await tx.slot.findUnique({ where: { id: dto.slotId }, select: { id: true, remaining: true } });
      if (!slot) throw new BadRequestException("slot_not_found");

      const dec = await tx.slot.updateMany({
        where: { id: slot.id, remaining: { gt: 0 } },
        data: { remaining: { decrement: 1 } },
      });
      if (dec.count !== 1) throw new BadRequestException("slot_full");

      const products = await tx.product.findMany({
        where: { id: { in: normalizedItems.map((i) => i.productId) }, merchantId: merchant.id },
        select: { id: true, name: true, priceCents: true, inStockBool: true },
      });

      if (products.length !== normalizedItems.length) throw new BadRequestException("invalid_products");
      if (products.some((p) => !p.inStockBool)) throw new BadRequestException("product_out_of_stock");

      const productById = new Map(products.map((p) => [p.id, p]));

      const subtotalCents = normalizedItems.reduce((sum, it) => {
        const p = productById.get(it.productId)!;
        return sum + p.priceCents * it.qty;
      }, 0);

      const totalQty = normalizedItems.reduce((sum, it) => sum + it.qty, 0);

      const totalsJson = {
        currency: "EUR",
        subtotalCents,
        deliveryFeeCents: 0,
        totalCents: subtotalCents,
        itemsCount: totalQty,
      };

      const orderCode = await this.generateOrderCode(tx as any);

      const order = await tx.order.create({
        data: {
          orderCode,
          consumerId: user.id,
          merchantId: merchant.id,
          slotId: dto.slotId,
          status: OrderStatus.PLACED,
          paymentStatus: PaymentStatus.UNPAID,
          totalsJson,
          addressJson: dto.address,
          instructions: dto.instructions,
          idempotencyKey: idem,
          items: {
            create: normalizedItems.map((it) => {
              const p = productById.get(it.productId)!;
              return {
                productId: p.id,
                nameSnapshot: p.name,
                unitPriceCents: p.priceCents,
                qty: it.qty,
              };
            }),
          },
        },
        select: orderDetailSelect,
      });

      const event = await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "ORDER_CREATED",
          payloadJson: { status: order.status },
          actorUserId: user.id,
        },
        select: { id: true, type: true, payloadJson: true, createdAt: true, actorUserId: true },
      });

      return { order, event };
    });

    // realtime emits
    this.realtime.emitAdmin("order.created", result.order);
    this.realtime.emitMerchant(result.order.merchant.id, "order.created", result.order);

    this.realtime.emitAdmin("order.event.created", result.event);
    this.realtime.emitMerchant(result.order.merchant.id, "order.event.created", result.event);

    return result.order;
  }

  async payOrder(user: AuthUser, orderId: string) {
    const orderBase = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, consumerId: true, merchantId: true, status: true, paymentStatus: true },
    });
    if (!orderBase) throw new NotFoundException("order_not_found");
    if (!canAccessOrder(user, orderBase)) throw new ForbiddenException("forbidden");
    if (user.role !== Role.CONSUMER && !isAdminLike(user.role)) throw new ForbiddenException("only_consumer_or_admin");

    if (orderBase.paymentStatus === PaymentStatus.PAID) {
      return this.getOrder(user, orderId);
    }

    const { order, event } = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: orderBase.status === OrderStatus.PLACED ? OrderStatus.PAID : orderBase.status,
        },
        select: orderDetailSelect,
      });

      const ev = await tx.orderEvent.create({
        data: {
          orderId: updated.id,
          type: "PAYMENT_PAID",
          payloadJson: { paymentStatus: updated.paymentStatus, status: updated.status },
          actorUserId: user.id,
        },
        select: { id: true, type: true, payloadJson: true, createdAt: true, actorUserId: true },
      });

      return { order: updated, event: ev };
    });

    // realtime
    this.realtime.emitAdmin("order.updated", order);
    this.realtime.emitMerchant(order.merchant.id, "order.updated", order);
    this.realtime.emitOrder(order.id, "order.updated", order);

    this.realtime.emitAdmin("order.event.created", event);
    this.realtime.emitMerchant(order.merchant.id, "order.event.created", event);
    this.realtime.emitOrder(order.id, "order.event.created", event);

    return order;
  }

  async updateStatus(user: AuthUser, orderId: string, next: OrderStatus) {
    const base = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, consumerId: true, merchantId: true, status: true },
    });
    if (!base) throw new NotFoundException("order_not_found");
    if (!canAccessOrder(user, base)) throw new ForbiddenException("forbidden");

    const adminLike = isAdminLike(user.role);
    const isMerchant = user.role === Role.MERCHANT;

    if (!adminLike && !isMerchant) throw new ForbiddenException("only_merchant_or_admin");

    if (isMerchant) {
      if (!user.merchantId || base.merchantId !== user.merchantId) throw new ForbiddenException("forbidden");
      const allowed = merchantNext[base.status] ?? [];
      if (!allowed.includes(next)) {
        throw new BadRequestException({ error: "invalid_transition", from: base.status, to: next });
      }
    }

    if (base.status === next) return this.getOrder(user, orderId);

    const { order, event } = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: next },
        select: orderDetailSelect,
      });

      const ev = await tx.orderEvent.create({
        data: {
          orderId: updated.id,
          type: "STATUS_CHANGED",
          payloadJson: { from: base.status, to: next },
          actorUserId: user.id,
        },
        select: { id: true, type: true, payloadJson: true, createdAt: true, actorUserId: true },
      });

      return { order: updated, event: ev };
    });

    this.realtime.emitAdmin("order.updated", order);
    this.realtime.emitMerchant(order.merchant.id, "order.updated", order);
    this.realtime.emitOrder(order.id, "order.updated", order);

    this.realtime.emitAdmin("order.event.created", event);
    this.realtime.emitMerchant(order.merchant.id, "order.event.created", event);
    this.realtime.emitOrder(order.id, "order.event.created", event);

    return order;
  }

  async refundOrder(user: AuthUser, orderId: string, amountCents?: number, reason?: string) {
    if (!isAdminLike(user.role)) throw new ForbiddenException("only_admin_support");

    const base = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, merchantId: true, totalsJson: true, paymentStatus: true },
    });
    if (!base) throw new NotFoundException("order_not_found");

    const totalCents = (base.totalsJson as any)?.totalCents;
    const amount = amountCents ?? totalCents;
    if (!amount || amount <= 0) throw new BadRequestException("invalid_refund_amount");

    const { order, refund, event } = await this.prisma.$transaction(async (tx) => {
      const r = await tx.refund.create({
        data: {
          orderId,
          amountCents: amount,
          reason,
          createdBy: user.id,
        },
        select: { id: true, orderId: true, amountCents: true, reason: true, createdBy: true, createdAt: true },
      });

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: PaymentStatus.REFUNDED, status: OrderStatus.REFUNDED },
        select: orderDetailSelect,
      });

      const ev = await tx.orderEvent.create({
        data: {
          orderId: updated.id,
          type: "REFUND_CREATED",
          payloadJson: { refundId: r.id, amountCents: r.amountCents, reason: r.reason },
          actorUserId: user.id,
        },
        select: { id: true, type: true, payloadJson: true, createdAt: true, actorUserId: true },
      });

      return { order: updated, refund: r, event: ev };
    });

    this.realtime.emitAdmin("refund.created", refund);
    this.realtime.emitMerchant(order.merchant.id, "refund.created", refund);
    this.realtime.emitOrder(order.id, "refund.created", refund);

    this.realtime.emitAdmin("order.updated", order);
    this.realtime.emitMerchant(order.merchant.id, "order.updated", order);
    this.realtime.emitOrder(order.id, "order.updated", order);

    this.realtime.emitAdmin("order.event.created", event);
    this.realtime.emitMerchant(order.merchant.id, "order.event.created", event);
    this.realtime.emitOrder(order.id, "order.event.created", event);

    return { order, refund };
  }
}
