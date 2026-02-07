"use client";

import React from "react";
import type { OrderStatus, PaymentStatus, TicketStatus } from "@/lib/d2y-types";

function pill(cls: string, text: string) {
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${cls}`}>{text}</span>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case "PLACED":
      return pill("bg-gray-200 text-gray-900", "PLACED");
    case "PAID":
      return pill("bg-[var(--d2y-yellow)] text-[var(--d2y-black)]", "PAID");
    case "ACCEPTED":
      return pill("bg-blue-200 text-blue-900", "ACCEPTED");
    case "PACKING":
      return pill("bg-orange-200 text-orange-900", "PACKING");
    case "READY_FOR_PICKUP":
      return pill("bg-green-200 text-green-900", "READY");
    case "CANCELLED":
      return pill("bg-red-200 text-red-900", "CANCELLED");
    case "REFUNDED":
      return pill("bg-purple-200 text-purple-900", "REFUNDED");
    default:
      return pill("bg-gray-200 text-gray-900", status);
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "UNPAID":
      return pill("bg-gray-200 text-gray-900", "UNPAID");
    case "PAID":
      return pill("bg-green-200 text-green-900", "PAID");
    case "REFUNDED":
      return pill("bg-purple-200 text-purple-900", "REFUNDED");
    default:
      return pill("bg-gray-200 text-gray-900", status);
  }
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  switch (status) {
    case "OPEN":
      return pill("bg-red-200 text-red-900", "OPEN");
    case "IN_PROGRESS":
      return pill("bg-orange-200 text-orange-900", "IN PROGRESS");
    case "RESOLVED":
      return pill("bg-green-200 text-green-900", "RESOLVED");
    case "CLOSED":
      return pill("bg-gray-300 text-gray-900", "CLOSED");
    default:
      return pill("bg-gray-200 text-gray-900", status);
  }
}
