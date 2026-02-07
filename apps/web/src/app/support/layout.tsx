"use client";

import React from "react";
import { RequireRole } from "@/components/RequireRole";
import { Topbar } from "@/components/Topbar";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["SUPPORT", "ADMIN"]}>
      <div className="min-h-screen">
        <Topbar title="Support" />
        <div className="p-4">{children}</div>
      </div>
    </RequireRole>
  );
}
