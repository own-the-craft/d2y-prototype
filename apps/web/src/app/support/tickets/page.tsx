"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { d2yApi } from "@/lib/d2y-api";
import type { TicketStatus } from "@/lib/d2y-types";
import { dt } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { TicketStatusBadge } from "@/components/Badges";

const statuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function SupportTicketsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const ticketsQ = useQuery({
    queryKey: ["tickets"],
    queryFn: () => d2yApi.tickets.list(token!),
    enabled: !!token,
    refetchInterval: 5000,
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      d2yApi.tickets.setStatus(token!, id, status),
    onSuccess: async () => {
      toast.success("Ticket updated");
      await qc.invalidateQueries({ queryKey: ["tickets"] });
      setUpdatingId(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow border border-black/10 flex items-center justify-between">
        <div>
          <div className="text-xl font-black">Tickets</div>
          <div className="text-sm text-black/60">Realtime + 5s polling fallback.</div>
        </div>
        <Link className="underline text-sm" href="/admin/orders">Go to orders</Link>
      </div>

      <div className="bg-white rounded-xl p-4 shadow border border-black/10">
        {ticketsQ.isLoading && <div>Loading…</div>}
        {ticketsQ.error && <div className="text-red-600">Error: {(ticketsQ.error as any).message}</div>}

        {!ticketsQ.isLoading && !ticketsQ.error && (
          <div className="space-y-3">
            {(ticketsQ.data ?? []).map((t) => (
              <div key={t.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-bold">{t.subject}</div>
                    <div className="text-sm text-black/70">{t.message}</div>
                    <div className="text-xs text-black/50 mt-1">
                      {dt(t.createdAt)} • consumer: {t.consumer?.email ?? "-"} • order:{" "}
                      {t.orderId ? <Link className="underline" href={`/admin/orders/${t.orderId}`}>{t.orderId}</Link> : "-"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TicketStatusBadge status={t.status} />
                  </div>
                </div>

                <div className="mt-3 flex gap-2 items-center">
                  <select
                    className="border rounded px-2 py-2"
                    defaultValue={t.status}
                    onChange={(e) => setUpdatingId(`${t.id}:${e.target.value}`)}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <button
                    className="px-3 py-2 rounded font-bold bg-[var(--d2y-black)] text-[var(--d2y-yellow)] disabled:opacity-40"
                    disabled={!updatingId?.startsWith(t.id + ":") || updateM.isPending}
                    onClick={() => {
                      const status = (updatingId?.split(":")[1] ?? t.status) as TicketStatus;
                      updateM.mutate({ id: t.id, status });
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}

            {(ticketsQ.data ?? []).length === 0 && (
              <div className="text-black/60">No tickets yet. Maak er één via consumer (Swagger) om realtime te zien.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
