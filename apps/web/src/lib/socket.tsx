"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "./env";
import { useAuth } from "./auth";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

type SocketState = {
  socket: Socket | null;
  connected: boolean;
};

const SocketContext = createContext<SocketState | null>(null);

function invalidatePrefix(queryClient: any, prefix: string) {
  queryClient.invalidateQueries({
    predicate: (q: any) => Array.isArray(q.queryKey) && q.queryKey[0] === prefix,
  });
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      if (socket) socket.disconnect();
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"], // fallback toegestaan
    });

    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    s.on("connected", (payload) => {
      // backend emit bij connect
      console.log("socket connected payload", payload);
    });

    // Order events
    s.on("order.created", (order) => {
      toast.success(`New order ${order?.orderCode ?? ""}`);
      invalidatePrefix(queryClient, "orders");
    });

    s.on("order.updated", (order) => {
      toast(`Order updated ${order?.orderCode ?? ""}`);
      invalidatePrefix(queryClient, "orders");
      if (order?.id) {
        queryClient.invalidateQueries({ queryKey: ["order", order.id] });
        queryClient.invalidateQueries({ queryKey: ["orderEvents", order.id] });
      }
    });

    s.on("order.event.created", (ev) => {
      if (ev?.orderId) {
        queryClient.invalidateQueries({ queryKey: ["orderEvents", ev.orderId] });
      }
    });

    // Tickets & refunds
    s.on("ticket.created", () => {
      toast("New ticket");
      invalidatePrefix(queryClient, "tickets");
    });

    s.on("refund.created", () => {
      toast("Refund created");
      invalidatePrefix(queryClient, "orders");
    });

    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
}
