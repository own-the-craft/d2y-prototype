export function euros(cents?: number) {
  const v = typeof cents === "number" ? cents : 0;
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v / 100);
}

export function dt(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("nl-NL", { hour: "2-digit", minute: "2-digit", year: "numeric", month: "2-digit", day: "2-digit" });
}
