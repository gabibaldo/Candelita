export function formatMoney(n: number | null | undefined) {
  if (n == null) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(d: Date | string | null | undefined) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function edadDesde(fecha: Date | string | null | undefined) {
  if (!fecha) return null;
  const n = typeof fecha === "string" ? new Date(fecha) : fecha;
  const diff = Date.now() - n.getTime();
  const años = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return años;
}

export function fullName(p: { nombre: string; apellido: string }) {
  return `${p.apellido}, ${p.nombre}`.trim();
}
