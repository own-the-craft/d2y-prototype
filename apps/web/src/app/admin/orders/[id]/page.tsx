"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { d2yApi } from "@/lib/d2y-api";
import { euros, dt } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/Badges";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { token } = useAuth();
  const qc = useQueryClient();
  const [reason, setReason] = useState("Demo full refund");

  const orderQ = useQuery({
    queryKey: ["order", id],
    queryFn: () => d2yApi.orders.get(token!, id),
    enabled: !!token && !!id,
    refetchInterval: 5000,
  });

  const eventsQ = useQuery({
    queryKey: ["orderEvents", id],
    queryFn: () => d2yApi.orders.events(token!, id),
    enabled: !!token && !!id,
    refetchInterval: 5000,
  });

  const refundM = useMutation({
    mutationFn: () => d2yApi.orders.refund(token!, id, reason),
    onSuccess: async () => {
      toast.success("Refund created");
      await qc.invalidateQueries({ queryKey: ["order", id] });
      await qc.invalidateQueries({ queryKey: ["orderEvents", id] });
      await qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Refund failed"),
  });

  const o = orderQ.data;
  const canRefund = o && o.paymentStatus !== "REFUNDED" && o.status !== "REFUNDED";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow border border-black/10">
        <Link className="underline text-sm" href="/admin/orders">
          ← Back to orders
        </Link>

        <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xl font-black">{o?.orderCode ?? "Order"}</div>
            {o && (
              <div className="flex gap-2 mt-2">
                <OrderStatusBadge status={o.status} />
                <PaymentStatusBadge status={o.paymentStatus} />
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-sm text-black/60">Total</div>
            <div className="text-2xl font-black">
              {o ? euros(o.totalsJson?.totalCents) : "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow border border-black/10">
          <div className="font-bold mb-2">Customer</div>
          {o && (
            <div className="text-sm space-y-1">
              <div><span className="text-black/60">Name:</span> {o.consumer.name}</div>
              <div><span className="text-black/60">Email:</span> {o.consumer.email}</div>
              <div><span className="text-black/60">Merchant:</span> {o.merchant.name}</div>
              <div><span className="text-black/60">Created:</span> {dt(o.createdAt)}</div>
              <div><span className="text-black/60">Slot:</span> {o.slot.type} {o.slot.date} {o.slot.startTime}-{o.slot.endTime}</div>
            </div>
          )}

          <div className="mt-4 font-bold">Address</div>
          {o && (
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(o.addressJson, null, 2)}
            </pre>
          )}

          {o?.instructions && (
            <>
              <div className="mt-2 font-bold">Instructions</div>
              <div className="text-sm">{o.instructions}</div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow border border-black/10">
          <div className="font-bold mb-2">Refund</div>
          <div className="text-sm text-black/60 mb-2">
            Fake provider — sets order to REFUNDED.
          </div>

          <input
            className="border rounded px-3 py-2 w-full"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <button
            className="mt-3 w-full px-3 py-2 rounded font-black bg-[var(--d2y-black)] text-[var(--d2y-yellow)] hover:bg-[var(--d2y-yellow)] hover:text-[var(--d2y-black)] transition-colors disabled:opacity-40"
            disabled={!canRefund || refundM.isPending}
            onClick={() => refundM.mutate()}
          >
            FULL REFUND
          </button>

          {!canRefund && (
            <div className="mt-2 text-sm text-black/60">
              Already refunded.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow border border-black/10">
        <div className="font-bold mb-2">Timeline</div>
        {(eventsQ.data ?? []).map((ev) => (
          <div key={ev.id} className="border-b last:border-b-0 py-2 text-sm">
            <div className="font-semibold">{ev.type}</div>
            <div className="text-xs text-black/60">{dt(ev.createdAt)}</div>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(ev.payloadJson, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
