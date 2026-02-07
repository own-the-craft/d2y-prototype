"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role, useAuth } from "@/lib/auth";

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { ready, user, token, roleHome } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (!roles.includes(user.role)) {
      router.replace(roleHome(user.role));
      return;
    }
  }, [ready, user, token, roles, router, roleHome]);

  if (!ready) return <div className="p-6">Loading...</div>;
  if (!token || !user) return <div className="p-6">Redirecting to login...</div>;
  if (!roles.includes(user.role)) return <div className="p-6">Redirecting...</div>;

  return <>{children}</>;
}
