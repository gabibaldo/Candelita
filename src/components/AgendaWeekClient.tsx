"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CircleDashed,
  Phone,
  StickyNote,
  X,
  CalendarClock,
  Bell,
  AlertTriangle,
  BellOff,
  Video,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import { edadDesde } from "@/lib/utils";

export type TurnoAgenda = {
  id: number;
  inicio: string;
  fin: string;
  estado: string;
  modalidad: string;
  cobrado: boolean;
  confirmado: boolean;
  importe: number | null;
  notas: string | null;
  meetLink: string | null;
  paciente: {
    id: number;
    nombre: string;
    apellido: string;
    tipo: string;
    obraSocialNombre: string | null;
    tutorNombre: string | null;
    tutorTelefono: string | null;
    fechaNacimiento: string | null;
  };
  sesion: { id: number } | null;
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function TipoChip({
  tipo,
  obraSocial,
}: {
  tipo: string;
  obraSocial: string | null;
}) {
  if (tipo === "obra_social")
    return (
      <span className="chip bg-blue-100 text-blue-800">
        OS · {obraSocial ?? "—"}
      </span>
    );
  return <span className="chip bg-sage-100 text-sage-700">Particular</span>;
}

export default function AgendaWeekClient({
  initialTurnos,
  todayStr,
  visibleDayKeys,
}: {
  initialTurnos: TurnoAgenda[];
  todayStr: string;
  visibleDayKeys: string[];
}) {
  const [turnos, setTurnos] = useState<TurnoAgenda[]>(initialTurnos);
  const [selected, setSelected] = useState<TurnoAgenda | null>(null);
  // new Date(0) durante SSR → no hay "isNow" ni "isPast" hasta montar en cliente
  const [now, setNow] = useState(new Date(0));
  useEffect(() => { setNow(new Date()); }, []);

  const byDay = new Map<string, TurnoAgenda[]>();
  for (const t of turnos) {
    const key = new Date(t.inicio).toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(t);
  }

  const visibleSet = new Set(visibleDayKeys);
  const diasFuturos = Array.from(byDay.entries())
    .filter(([k]) => k >= todayStr && visibleSet.has(k))
    .sort(([a], [b]) => a.localeCompare(b));

  async function toggleCobrado(turno: TurnoAgenda) {
    const next = !turno.cobrado;
    setTurnos((prev) =>
      prev.map((t) => (t.id === turno.id ? { ...t, cobrado: next } : t))
    );
    await fetch(`/api/turnos/${turno.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cobrado: next }),
    });
  }

  async function toggleConfirmado(turno: TurnoAgenda) {
    const next = !turno.confirmado;
    setTurnos((prev) =>
      prev.map((t) => (t.id === turno.id ? { ...t, confirmado: next } : t))
    );
    await fetch(`/api/turnos/${turno.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmado: next }),
    });
  }

  return (
    <>
      {/* Vista calendario semanal */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${visibleDayKeys.length}, minmax(90px, 1fr))`,
            minWidth: `${visibleDayKeys.length * 98}px`,
          }}
        >
          {visibleDayKeys.map((dateKey) => {
            const isToday = dateKey === todayStr;
            const dTurnos = byDay.get(dateKey) ?? [];
            const pivot = new Date(dateKey + "T12:00:00-03:00");
            const dayName = pivot.toLocaleDateString("es-AR", {
              weekday: "short",
              timeZone: "America/Argentina/Buenos_Aires",
            });
            const dayNum = pivot.toLocaleDateString("es-AR", {
              day: "numeric",
              timeZone: "America/Argentina/Buenos_Aires",
            });
            return (
              <div
                key={dateKey}
                className={
                  "rounded-xl border p-2 " +
                  (isToday
                    ? "border-brand-400 bg-brand-50/40"
                    : "border-ink-200/70 bg-white/50")
                }
              >
                <div
                  className={
                    "flex items-center justify-between mb-2 pb-1.5 border-b " +
                    (isToday ? "border-brand-200" : "border-ink-100")
                  }
                >
                  <span
                    className={
                      "text-[11px] font-semibold uppercase tracking-wider capitalize" +
                      (isToday ? "text-brand-700" : "text-ink-400")
                    }
                  >
                    {dayName}
                  </span>
                  <div className="flex items-center gap-1">
                    {isToday && (
                      <span className="text-[8px] bg-brand-700 text-white px-1 py-0.5 rounded-full font-bold leading-none">
                        HOY
                      </span>
                    )}
                    <span
                      className={
                        "text-sm font-bold tabular-nums " +
                        (isToday ? "text-brand-800" : "text-ink-700")
                      }
                    >
                      {dayNum}
                    </span>
                  </div>
                </div>
                {dTurnos.length === 0 ? (
                  <p className="text-[10px] text-ink-300 text-center py-2">
                    libre
                  </p>
                ) : (
                  <ol className="space-y-1">
                    {dTurnos.map((t) => (
                      <li key={t.id}>
                        <button
                          onClick={() => setSelected(t)}
                          className={
                            "w-full text-left rounded-lg p-1.5 hover:opacity-80 transition active:scale-95 " +
                            (t.paciente.tipo === "obra_social"
                              ? "bg-blue-50 border border-blue-100"
                              : "bg-emerald-50 border border-emerald-100")
                          }
                        >
                          <p className="text-xs font-semibold text-ink-800 truncate leading-tight">
                            {t.paciente.apellido}, {t.paciente.nombre}
                          </p>
                          <p className="text-[10px] text-ink-500 tabular-nums">
                            {new Date(t.inicio).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                              timeZone: "America/Argentina/Buenos_Aires",
                            })}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista detallada — hoy y próximos días */}
      {diasFuturos.length > 0 && (
        <div className="space-y-5">
          {diasFuturos.map(([dateKey, dTurnos]) => {
            const isToday = dateKey === todayStr;
            const pivot = new Date(dateKey + "T12:00:00-03:00");
            const dayLabel = pivot.toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "America/Argentina/Buenos_Aires",
            });
            return (
              <div key={dateKey}>
                <h3
                  className={
                    "text-xs font-semibold uppercase tracking-wider mb-2" +
                    (isToday ? "text-brand-700" : "text-ink-400")
                  }
                >
                  {isToday
                    ? `Hoy · ${capitalize(dayLabel)}`
                    : capitalize(dayLabel)}
                </h3>
                <ol className="space-y-2">
                  {dTurnos.map((t) => {
                    const edad = edadDesde(t.paciente.fechaNacimiento);
                    const isPast = new Date(t.fin) < now;
                    const isNow =
                      new Date(t.inicio) <= now && new Date(t.fin) >= now;
                    return (
                      <li key={t.id}>
                        <div
                          className={
                            "card p-3 flex items-center gap-3 hover:shadow-pop transition " +
                            (isNow ? "ring-2 ring-brand-400" : "")
                          }
                        >
                          {/* Hora — clickeable para abrir detalle */}
                          <button
                            onClick={() => setSelected(t)}
                            className="w-12 shrink-0 text-center group"
                          >
                            <p
                              className={
                                "text-base font-semibold tabular-nums group-hover:text-brand-700 transition " +
                                (isNow ? "text-brand-700" : "text-ink-700")
                              }
                            >
                              {new Date(t.inicio).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "America/Argentina/Buenos_Aires",
                              })}
                            </p>
                            <p className="text-[10px] text-ink-400">
                              {Math.round(
                                (new Date(t.fin).getTime() -
                                  new Date(t.inicio).getTime()) /
                                  60000
                              )}{" "}
                              min
                            </p>
                          </button>

                          <Avatar
                            nombre={t.paciente.nombre}
                            apellido={t.paciente.apellido}
                            size="sm"
                          />

                          {/* Info paciente — clickeable para abrir detalle */}
                          <button
                            onClick={() => setSelected(t)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-ink-800 hover:text-brand-700 transition">
                                {t.paciente.apellido}, {t.paciente.nombre}
                              </span>
                              {edad != null && (
                                <span className="text-xs text-ink-400">
                                  {edad} a
                                </span>
                              )}
                              <TipoChip
                                tipo={t.paciente.tipo}
                                obraSocial={t.paciente.obraSocialNombre}
                              />
                              {t.modalidad === "virtual" && (
                                <span className="chip bg-violet-100 text-violet-700">
                                  🖥 virtual
                                </span>
                              )}
                              {t.confirmado && (
                                <span className="chip bg-brand-100 text-brand-700">
                                  <Bell className="w-3 h-3" /> confirmado
                                </span>
                              )}
                              {t.sesion && (
                                <span className="chip bg-sage-100 text-sage-700">
                                  <CheckCircle2 className="w-3 h-3" /> sesión
                                </span>
                              )}
                              {t.estado === "realizado" && !t.sesion && (
                                <span className="chip bg-amber-100 text-amber-700">
                                  <AlertTriangle className="w-3 h-3" /> sin sesión
                                </span>
                              )}
                            </div>
                            {(t.paciente.tutorNombre ||
                              t.paciente.tutorTelefono) && (
                              <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {t.paciente.tutorNombre ?? "—"}
                                {t.paciente.tutorTelefono
                                  ? ` · ${t.paciente.tutorTelefono}`
                                  : ""}
                              </p>
                            )}
                          </button>

                          {/* Acciones */}
                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            {/* Meet link — solo turnos virtuales con link */}
                            {t.modalidad === "virtual" && t.meetLink && (
                              <a
                                href={t.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 transition"
                              >
                                <Video className="w-3 h-3" /> Meet
                              </a>
                            )}
                            {/* Confirmar turno */}
                            {!isPast && (
                              <button
                                onClick={() => toggleConfirmado(t)}
                                title={t.confirmado ? "Marcar sin confirmar" : "Confirmar asistencia"}
                                className={
                                  "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition " +
                                  (t.confirmado
                                    ? "bg-brand-100 text-brand-700 border-brand-200 hover:bg-brand-200"
                                    : "bg-white text-ink-500 border-ink-200 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200")
                                }
                              >
                                {t.confirmado ? <><Bell className="w-3 h-3" /> confirmado</> : <><BellOff className="w-3 h-3" /> confirmar</>}
                              </button>
                            )}
                            {/* Cobrado */}
                            <button
                              onClick={() => toggleCobrado(t)}
                              title={t.cobrado ? "Marcar sin cobrar" : "Marcar cobrado"}
                              className={
                                "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition " +
                                (t.cobrado
                                  ? "bg-sage-100 text-sage-700 border-sage-200 hover:bg-sage-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100")
                              }
                            >
                              {t.cobrado ? <><CheckCircle2 className="w-3 h-3" /> cobrado</> : <><CircleDashed className="w-3 h-3" /> cobrar</>}
                            </button>
                            {/* Cargar sesión — siempre visible si no tiene sesión */}
                            {!t.sesion && (
                              <Link
                                href={`/pacientes/${t.paciente.id}#nueva-sesion`}
                                className={
                                  "text-xs font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition " +
                                  (t.estado === "realizado"
                                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                    : "text-brand-700 hover:underline border-transparent")
                                }
                              >
                                <StickyNote className="w-3 h-3" />
                                {t.estado === "realizado" ? "cargar sesión" : "sesión"}
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalle de turno (solo lectura) */}
      {selected && (
        <TurnoDetailModal turno={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function TurnoDetailModal({
  turno,
  onClose,
}: {
  turno: TurnoAgenda;
  onClose: () => void;
}) {
  const { paciente } = turno;
  const inicio = new Date(turno.inicio);
  const fin = new Date(turno.fin);
  const dur = Math.round((fin.getTime() - inicio.getTime()) / 60000);
  const isOS = paciente.tipo === "obra_social";

  const estadoLabel: Record<string, string> = {
    programado: "Programado",
    realizado: "Realizado",
    cancelado: "Cancelado",
    ausente: "Ausente",
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-50 border-b border-brand-100 px-6 py-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="w-4 h-4 text-brand-500" />
              <span className="text-xs text-brand-600 font-semibold uppercase tracking-wider">
                Detalle del turno
              </span>
            </div>
            <h3 className="text-lg font-semibold text-brand-800">
              {paciente.apellido}, {paciente.nombre}
            </h3>
            <span
              className={
                "chip text-xs mt-1 " +
                (isOS
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800")
              }
            >
              {isOS
                ? `OS · ${paciente.obraSocialNombre ?? "—"}`
                : "Particular"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-icon !p-1.5 text-ink-400 mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-ink-500 mb-0.5">Día</p>
              <p className="font-medium text-ink-800 capitalize">
                {inicio.toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "America/Argentina/Buenos_Aires",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-0.5">Horario</p>
              <p className="font-medium text-ink-800 tabular-nums">
                {inicio.toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "America/Argentina/Buenos_Aires",
                })}
                {" – "}
                {fin.toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "America/Argentina/Buenos_Aires",
                })}
                <span className="text-ink-400 text-xs ml-1">({dur} min)</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-0.5">Estado</p>
              <p className="font-medium text-ink-800">
                {estadoLabel[turno.estado] ?? turno.estado}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-0.5">Modalidad</p>
              <p className="font-medium text-ink-800">
                {turno.modalidad === "virtual" ? "🖥 Virtual" : "🏥 Presencial"}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-0.5">Cobrado</p>
              <p
                className={
                  "font-medium " +
                  (turno.cobrado ? "text-sage-700" : "text-amber-700")
                }
              >
                {turno.cobrado ? "✓ Sí" : "Pendiente"}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-0.5">Confirmado</p>
              <p className={"font-medium " + (turno.confirmado ? "text-brand-700" : "text-ink-400")}>
                {turno.confirmado ? "✓ Sí" : "No"}
              </p>
            </div>
            {turno.importe != null && (
              <div>
                <p className="text-xs text-ink-500 mb-0.5">Importe</p>
                <p className="font-medium text-ink-800">
                  ${turno.importe.toLocaleString("es-AR")}
                </p>
              </div>
            )}
            {turno.sesion && (
              <div>
                <p className="text-xs text-ink-500 mb-0.5">Sesión clínica</p>
                <p className="font-medium text-sage-700">Cargada ✓</p>
              </div>
            )}
          </div>

          {turno.modalidad === "virtual" && turno.meetLink && (
            <a
              href={turno.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-4 py-2 hover:bg-violet-100 transition w-full justify-center"
            >
              <Video className="w-4 h-4" /> Abrir Google Meet
            </a>
          )}

          {turno.notas && (
            <div>
              <p className="text-xs text-ink-500 mb-1">Notas</p>
              <p className="text-sm bg-ink-50 rounded-lg p-3 text-ink-700">
                {turno.notas}
              </p>
            </div>
          )}

          {(paciente.tutorNombre || paciente.tutorTelefono) && (
            <div className="flex items-center gap-2 text-sm text-ink-600">
              <Phone className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              <span>
                {paciente.tutorNombre ?? "—"}
                {paciente.tutorTelefono
                  ? ` · ${paciente.tutorTelefono}`
                  : ""}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 flex gap-2">
          <Link
            href={`/pacientes/${paciente.id}/historia`}
            className="btn-ghost flex-1 text-center text-sm"
            onClick={onClose}
          >
            Historia clínica
          </Link>
          <Link
            href={`/pacientes/${paciente.id}`}
            className="btn-primary flex-1 text-center text-sm"
            onClick={onClose}
          >
            Ficha del paciente
          </Link>
        </div>
      </div>
    </div>
  );
}
