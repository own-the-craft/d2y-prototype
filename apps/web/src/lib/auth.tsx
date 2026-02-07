"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "./env";

export type Role = "CONSUMER" | "MERCHANT" | "ADMIN" | "SUPPORT";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
  merchantId?: string;
};

type AuthState = {
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  roleHome: (role: Role) => string;
};

const TOKEN_KEY = "d2y_token";
const USER_KEY = "d2y_user";

function roleHome(role: Role): string {
  if (role === "MERCHANT") return "/partner/orders";
  if (role === "ADMIN") return "/admin/orders";
  if (role === "SUPPORT") return "/support/tickets";
  return "/"; // consumer gebruikt mobile; web heeft geen consumer portal vandaag
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // load from localStorage
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setReady(true);
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const data = await res.json();
    const t = data.token as string;
    const u = data.user as AuthUser;

    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo<AuthState>(
    () => ({
      ready,
      token,
      user,
      login,
      logout,
      roleHome,
    }),
    [ready, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const getRoleHome = roleHome;
