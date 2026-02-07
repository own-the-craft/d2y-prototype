"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { d2yApi } from "@/lib/d2y-api";
import { euros, dt } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/Badges";

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [q, setQ] = useState("D2Y");

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", "admin", q],
    queryFn: () => d2yApi.orders.list(token!, q || undefined),
    enabled: !!token,
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow border border-black/10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xl font-black text-[var(--d2y-black)]">Orders</div>
            <div className="text-sm text-black/60">Search by orderCode (e.g. D2Y123456). Realtime + polling fallback.</div>
          </div>
          <div className="flex items-center gap-2">
            <Link className="underline text-sm" href="/support/tickets">Go to tickets</Link>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="border rounded px-3 py-2 w-64"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search orderCode (D2Y...)"
          />
          <button
            className="px-3 py-2 rounded font-bold bg-[var(--d2y-black)] text-[var(--d2y-yellow)]"
            onClick={() => setQ((v) => v.trim())}
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow border border-black/10">
        {isLoading && <div>Loading…</div>}
        {error && <div className="text-red-600">Error: {(error as any).message}</div>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Order</th>
                  <th className="py-2">Merchant</th>
                  <th className="py-2">Consumer</th>
                  <th className="py-2">Time</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Payment</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((o) => (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="py-2 font-semibold">{o.orderCode}</td>
                    <td className="py-2">{o.merchant.name}</td>
                    <td className="py-2">{o.consumer.email}</td>
                    <td className="py-2">{dt(o.createdAt)}</td>
                    <td className="py-2"><OrderStatusBadge status={o.status} /></td>
                    <td className="py-2"><PaymentStatusBadge status={o.paymentStatus} /></td>
                    <td className="py-2 text-right font-semibold">{euros(o.totalsJson?.totalCents)}</td>
                    <td className="py-2 text-right">
                      <Link className="underline" href={`/admin/orders/${o.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(data ?? []).length === 0 && (
              <div className="text-black/60 mt-3">No results.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
