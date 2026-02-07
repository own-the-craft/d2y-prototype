"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { d2yApi } from "@/lib/d2y-api";
import type { OrderStatus } from "@/lib/d2y-types";
import { euros, dt } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/Badges";

export default function PartnerOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { token } = useAuth();
  const qc = useQueryClient();

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

  const setStatus = useMutation({
    mutationFn: (status: OrderStatus) =>
      d2yApi.orders.setStatus(token!, id, status),
    onSuccess: async () => {
      toast.success("Status updated");
      await qc.invalidateQueries({ queryKey: ["order", id] });
      await qc.invalidateQueries({ queryKey: ["orderEvents", id] });
      await qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const o = orderQ.data;

  const canAccept = o?.status === "PAID";
  const canPacking = o?.status === "ACCEPTED";
  const canReady = o?.status === "PACKING";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow border border-black/10 flex items-center justify-between">
        <div>
          <Link className="underline text-sm" href="/partner/orders">
            ← Back to orders
          </Link>
          <div className="text-xl font-black mt-2">
            {o?.orderCode ?? "Order"}
          </div>
          {o && (
            <div className="flex gap-2 mt-2">
              <OrderStatusBadge status={o.status} />
              <PaymentStatusBadge status={o.paymentStatus} />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded font-bold bg-[var(--d2y-black)] text-[var(--d2y-yellow)] disabled:opacity-40"
            disabled={!canAccept}
            onClick={() => setStatus.mutate("ACCEPTED")}
          >
            ACCEPT
          </button>
          <button
            className="px-3 py-2 rounded font-bold bg-[var(--d2y-black)] text-[var(--d2y-yellow)] disabled:opacity-40"
            disabled={!canPacking}
            onClick={() => setStatus.mutate("PACKING")}
          >
            PACKING
          </button>
          <button
            className="px-3 py-2 rounded font-bold bg-[var(--d2y-black)] text-[var(--d2y-yellow)] disabled:opacity-40"
            disabled={!canReady}
            onClick={() => setStatus.mutate("READY_FOR_PICKUP")}
          >
            READY
          </button>
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
