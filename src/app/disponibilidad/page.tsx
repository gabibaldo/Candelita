import { prisma } from "@/lib/db";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

const HORA_INICIO = 14;
const HORA_FIN = 20;
const SLOT_MINS = 60;

function arDateStr(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

function weekRangeAR() {
  const todayStr = arDateStr();
  const pivot = new Date(todayStr + "T12:00:00-03:00");
  const dow = pivot.getDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(pivot);
  monday.setDate(pivot.getDate() + toMonday);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return {
    start: new Date(arDateStr(monday) + "T00:00:00-03:00"),
    end: new Date(arDateStr(saturday) + "T23:59:59-03:00"),
    todayStr,
  };
}

function slotKey(dateStr: string, hora: number) {
  return `${dateStr}T${String(hora).padStart(2, "0")}:00`;
}

export default async function DisponibilidadPage() {
  const { start, end, todayStr } = weekRangeAR();

  const turnos = await prisma.turno.findMany({
    where: {
      inicio: { gte: start, lte: end },
      estado: { in: ["programado", "realizado"] },
    },
    select: {
      inicio: true,
      fin: true,
      paciente: { select: { nombre: true, apellido: true } },
    },
    orderBy: { inicio: "asc" },
  });

  const bloqueos = await prisma.bloqueoDia.findMany({
    where: { inicio: { gte: start }, fin: { lte: end } },
  });

  // Construir mapa de slots ocupados: key = "YYYY-MM-DDTHH:00"
  const ocupados = new Map<string, string>(); // key → label
  for (const t of turnos) {
    const ini = new Date(t.inicio);
    const h = parseInt(
      ini.toLocaleTimeString("en-CA", { hour: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" })
    );
    const dateStr = ini.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    const key = slotKey(dateStr, h);
    ocupados.set(key, `${t.paciente.apellido}, ${t.paciente.nombre}`);
  }

  // Días de la semana: lunes a sábado
  const dias = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(start.getTime() + i * 86_400_000);
    const dateStr = arDateStr(d);
    const label = d.toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;

    // Slots del día
    const slots = Array.from(
      { length: (HORA_FIN - HORA_INICIO) * (60 / SLOT_MINS) },
      (_, si) => {
        const hora = HORA_INICIO + si * (SLOT_MINS / 60);
        const key = slotKey(dateStr, hora);
        const paciente = ocupados.get(key) ?? null;
        const horaLabel = `${String(hora).padStart(2, "0")}:00`;
        return { hora, horaLabel, paciente, key };
      }
    );

    const libres = slots.filter((s) => !s.paciente).length;

    return { dateStr, label, isToday, isPast, slots, libres };
  });

  const totalLibres = dias.reduce((a, d) => a + d.libres, 0);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-ink-500">Agenda</p>
          <h1 className="text-2xl font-semibold text-ink-800">Disponibilidad</h1>
          <p className="text-xs text-ink-400 mt-1">
            {totalLibres} slot{totalLibres !== 1 ? "s" : ""} libre{totalLibres !== 1 ? "s" : ""} esta semana · 14–20hs
          </p>
        </div>
        <Link href="/calendario" className="btn-ghost text-sm">
          <CalendarDays className="w-4 h-4" />
          Ver calendario
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {dias.map((dia) => (
          <div
            key={dia.dateStr}
            className={`card p-3 space-y-2 ${dia.isPast ? "opacity-50" : ""} ${dia.isToday ? "ring-2 ring-brand-400" : ""}`}
          >
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wider capitalize ${dia.isToday ? "text-brand-600" : "text-ink-500"}`}>
                {dia.label}
              </p>
              <p className="text-[10px] text-ink-400">
                {dia.libres === 0 ? "Sin huecos" : `${dia.libres} libre${dia.libres !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="space-y-1">
              {dia.slots.map((slot) => (
                <div
                  key={slot.key}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${
                    slot.paciente
                      ? "bg-brand-100 text-brand-700"
                      : "bg-sage-50 text-sage-700 border border-sage-200"
                  }`}
                >
                  <span className="tabular-nums font-semibold">{slot.horaLabel}</span>
                  {slot.paciente && (
                    <p className="text-[10px] font-normal truncate mt-0.5 text-brand-600">
                      {slot.paciente}
                    </p>
                  )}
                  {!slot.paciente && (
                    <p className="text-[10px] font-normal text-sage-500 mt-0.5">Libre</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
