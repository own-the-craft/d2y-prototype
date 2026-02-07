export type Role = "CONSUMER" | "MERCHANT" | "ADMIN" | "SUPPORT";

export type SlotType = "DELIVERY" | "CNC";

export type OrderStatus =
  | "PLACED"
  | "PAID"
  | "ACCEPTED"
  | "PACKING"
  | "READY_FOR_PICKUP"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type MoneyTotals = {
  currency: "EUR";
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  itemsCount: number;
};

export type MerchantLite = { id: string; name: string };
export type ConsumerLite = { id: string; email: string; name: string };

export type SlotLite = {
  id: string;
  date: string;
  type: SlotType;
  startTime: string;
  endTime: string;
};

export type OrderListItem = {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  totalsJson: MoneyTotals;
  merchant: MerchantLite;
  consumer: ConsumerLite;
  slot: SlotLite;
};

export type OrderItem = {
  id: string;
  productId: string;
  nameSnapshot: string;
  unitPriceCents: number;
  qty: number;
};

export type OrderDetail = OrderListItem & {
  addressJson: any;
  instructions?: string | null;
  updatedAt: string;
  items: OrderItem[];
};

export type OrderEvent = {
  id: string;
  type: string;
  payloadJson: any;
  createdAt: string;
  actorUserId?: string | null;
};

export type Ticket = {
  id: string;
  orderId?: string | null;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  consumer?: ConsumerLite;
};
