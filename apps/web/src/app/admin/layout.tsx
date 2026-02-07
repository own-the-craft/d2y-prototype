"use client";

import React from "react";
import { RequireRole } from "@/components/RequireRole";
import { Topbar } from "@/components/Topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["ADMIN", "SUPPORT"]}>
      <div className="min-h-screen">
        <Topbar title="Admin / Support Portal" />
        <div className="p-4">{children}</div>
      </div>
    </RequireRole>
  );
}
