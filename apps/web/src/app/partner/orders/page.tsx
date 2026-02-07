"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { d2yApi } from "@/lib/d2y-api";
import { euros, dt } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/Badges";

export default function PartnerOrdersPage() {
  const { token } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", "partner"],
    queryFn: () => d2yApi.orders.list(token!, "D2Y"), // quick filter (shows most demo orders)
    enabled: !!token,
    refetchInterval: 5000, // polling fallback (realtime also active)
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow border border-black/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-[var(--d2y-black)]">Orders</div>
            <div className="text-sm text-black/60">Realtime updates + 5s polling fallback.</div>
          </div>
          <a
            className="text-sm underline"
            href="/login"
          >
            Switch account
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow border border-black/10">
        {isLoading && <div>Loading orders…</div>}
        {error && <div className="text-red-600">Error: {(error as any).message}</div>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Order</th>
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
                    <td className="py-2">{dt(o.createdAt)}</td>
                    <td className="py-2"><OrderStatusBadge status={o.status} /></td>
                    <td className="py-2"><PaymentStatusBadge status={o.paymentStatus} /></td>
                    <td className="py-2 text-right font-semibold">{euros(o.totalsJson?.totalCents)}</td>
                    <td className="py-2 text-right">
                      <Link className="underline" href={`/partner/orders/${o.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(data ?? []).length === 0 && (
              <div className="text-black/60 mt-3">
                No orders yet. Maak een order via Swagger (consumer) om realtime binnen te zien komen.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
