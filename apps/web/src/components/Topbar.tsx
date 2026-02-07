"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useSocket } from "@/lib/socket";

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  return (
    <div className="w-full bg-[var(--d2y-black)] text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="font-black tracking-tight">
          <span className="text-white">DAILY</span>
          <span className="text-[var(--d2y-yellow)]">2</span>
          <span className="text-white">YOU</span>
        </div>
        <div className="text-sm opacity-90">{title}</div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="opacity-80">{connected ? "● realtime" : "○ offline"}</span>
        <span className="opacity-80">{user?.email}</span>
        <button
          className="bg-[var(--d2y-yellow)] text-[var(--d2y-black)] font-semibold px-3 py-1 rounded"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
