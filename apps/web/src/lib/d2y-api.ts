import { apiJson } from "./http";
import type { OrderDetail, OrderEvent, OrderListItem, Ticket, TicketStatus, OrderStatus } from "./d2y-types";

export const d2yApi = {
  orders: {
    list(token: string, q?: string) {
      const qs = q ? `?q=${encodeURIComponent(q)}` : "";
      return apiJson<OrderListItem[]>(`/orders${qs}`, { token });
    },
    get(token: string, id: string) {
      return apiJson<OrderDetail>(`/orders/${id}`, { token });
    },
    events(token: string, id: string) {
      return apiJson<OrderEvent[]>(`/orders/${id}/events`, { token });
    },
    setStatus(token: string, id: string, status: OrderStatus) {
      return apiJson<OrderDetail>(`/orders/${id}/status`, { token, method: "POST", body: { status } });
    },
    refund(token: string, id: string, reason: string, amountCents?: number) {
      return apiJson<{ order: OrderDetail; refund: any }>(`/orders/${id}/refund`, {
        token,
        method: "POST",
        body: { reason, amountCents },
      });
    },
  },

  tickets: {
    list(token: string) {
      return apiJson<Ticket[]>(`/tickets`, { token });
    },
    setStatus(token: string, id: string, status: TicketStatus) {
      return apiJson<Ticket>(`/tickets/${id}/status`, { token, method: "POST", body: { status } });
    },
  },
};
