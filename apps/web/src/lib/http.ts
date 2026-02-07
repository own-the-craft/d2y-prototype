import { API_URL } from "./env";

export async function apiJson<T>(
  path: string,
  opts: { token?: string | null; method?: string; body?: any } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let details: any = null;
    try {
      details = await res.json();
    } catch {}
    const msg =
      details?.message ||
      details?.error ||
      (typeof details === "string" ? details : null) ||
      `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return (await res.json()) as T;
}
