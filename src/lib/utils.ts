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
  // Forzar UTC para fechas sin hora (ej: fechaNacimiento) para evitar
  // el corrimiento de un día por diferencia de timezone Argentina (UTC-3)
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
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
  // Comparar año/mes/día en UTC para no correrse por timezone
  const raw = typeof fecha === "string" ? fecha : fecha.toISOString();
  const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - y;
  if (
    hoy.getUTCMonth() + 1 < m ||
    (hoy.getUTCMonth() + 1 === m && hoy.getUTCDate() < d)
  ) {
    edad--;
  }
  return edad;
}

export function fullName(p: { nombre: string; apellido: string }) {
  return `${p.apellido}, ${p.nombre}`.trim();
}
