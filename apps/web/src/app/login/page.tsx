"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { ready, user, token, login, roleHome } = useAuth();

  const [email, setEmail] = useState("merchant@demo.com");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (token && user) router.replace(roleHome(user.role));
  }, [ready, token, user, router, roleHome]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success("Logged in");
      router.replace(roleHome(u.role));
    } catch (e: any) {
      toast.error(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-black/10 p-8">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-black tracking-tight">
            <span className="text-[var(--d2y-black)]">DAILY</span>
            <span className="text-[var(--d2y-yellow)]">2</span>
            <span className="text-[var(--d2y-black)]">YOU</span>
          </div>
          <div className="text-sm font-bold tracking-widest text-[var(--d2y-black)]">PORTAL</div>
        </div>

        <h1 className="text-4xl font-black mt-8 text-[var(--d2y-black)]">Login</h1>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <button
            type="button"
            className="border-2 border-[var(--d2y-black)] rounded-lg py-3 font-semibold"
            onClick={() => setEmail("merchant@demo.com")}
          >
            Merchant
          </button>
          <button
            type="button"
            className="border-2 border-[var(--d2y-black)] rounded-lg py-3 font-semibold"
            onClick={() => setEmail("admin@demo.com")}
          >
            Admin
          </button>
          <button
            type="button"
            className="border-2 border-[var(--d2y-black)] rounded-lg py-3 font-semibold"
            onClick={() => setEmail("support@demo.com")}
          >
            Support
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xl font-black text-[var(--d2y-black)]">Email</label>
            <input
              className="mt-2 w-full border-2 border-black/20 rounded-lg px-4 py-4 text-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xl font-black text-[var(--d2y-black)]">Password</label>
            <input
              className="mt-2 w-full border-2 border-black/20 rounded-lg px-4 py-4 text-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-4 text-xl font-black bg-[var(--d2y-black)] text-[var(--d2y-yellow)] hover:bg-[var(--d2y-yellow)] hover:text-[var(--d2y-black)] transition-colors disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-sm text-black/60">
            Demo: merchant/admin/support @demo.com — Password123!
          </div>
        </form>
      </div>
    </div>
  );
}
