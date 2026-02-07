"use client";

import React from "react";
import { RequireRole } from "@/components/RequireRole";
import { Topbar } from "@/components/Topbar";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["MERCHANT"]}>
      <div className="min-h-screen">
        <Topbar title="Partner Portal" />
        <div className="p-4">{children}</div>
      </div>
    </RequireRole>
  );
}
