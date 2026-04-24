"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed, CheckSquare, Square } from "lucide-react";
import Avatar from "@/components/Avatar";
import { formatMoney } from "@/lib/utils";

export type TurnoDeuda = {
  id: number;
  inicio: string;
  estado: string;
  importe: number | null;
  paciente: {
    id: number;
    nombre: string;
    apellido: string;
    importeSesion: number;
  };
};

export default function DeudasClient({
  initialTurnos,
  umbralDias,
}: {
  initialTurnos: TurnoDeuda[];
  umbralDias: number;
}) {
  const [turnos, setTurnos] = useState<TurnoDeuda[]>(initialTurnos);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  async function marcarCobrado(turnoId: number) {
    setTurnos((prev) => prev.filter((t) => t.id !== turnoId));
    setSelected((prev) => { const s = new Set(prev); s.delete(turnoId); return s; });
    await fetch(`/api/turnos/${turnoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cobrado: true }),
    });
  }

  async function marcarSeleccionados() {
    const ids = Array.from(selected);
    setTurnos((prev) => prev.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/turnos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cobrado: true }),
        })
      )
    );
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function toggleAll() {
    if (selected.size === turnos.length) setSelected(new Set());
    else setSelected(new Set(turnos.map((t) => t.id)));
  }

  if (turnos.length === 0) return null;

  const totalSeleccionado = turnos
    .filter((t) => selected.has(t.id))
    .reduce((a, t) => a + (t.importe ?? t.paciente.importeSesion), 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="section-title">
          Deuda pendiente
          <span className="ml-2 text-xs text-amber-600 font-normal normal-case tracking-normal">
            (+{umbralDias} días sin cobrar)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800 transition"
          >
            {selected.size === turnos.length ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            {selected.size === turnos.length ? "Ninguno" : "Todos"}
          </button>
          {selected.size > 0 && (
            <button
              onClick={marcarSeleccionados}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cobrar {selected.size} · {formatMoney(totalSeleccionado)}
            </button>
          )}
        </div>
      </div>
      <ul className="card divide-y divide-ink-200/70">
        {turnos.map((t) => {
          const monto = t.importe ?? t.paciente.importeSesion;
          const isSelected = selected.has(t.id);
          return (
            <li
              key={t.id}
              className={`p-3 flex items-center gap-3 transition cursor-pointer ${
                isSelected ? "bg-amber-50/60" : "hover:bg-ink-50/50"
              }`}
              onClick={() => toggleSelect(t.id)}
            >
              <div className="shrink-0">
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-amber-500" />
                ) : (
                  <Square className="w-4 h-4 text-ink-300" />
                )}
              </div>
              <Avatar
                nombre={t.paciente.nombre}
                apellido={t.paciente.apellido}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-800 truncate">
                  {t.paciente.apellido}, {t.paciente.nombre}
                </p>
                <p className="text-xs text-ink-500">
                  {new Date(t.inicio).toLocaleString("es-AR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Argentina/Buenos_Aires",
                  })}
                  {" · "}
                  {t.estado}
                </p>
              </div>
              <div
                className="shrink-0 flex flex-col items-end gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-sm font-semibold text-amber-700">
                  {formatMoney(monto)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => marcarCobrado(t.id)}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 transition"
                    title="Marcar como cobrado"
                  >
                    <CircleDashed className="w-3 h-3" /> cobrar
                  </button>
                  <Link
                    href={`/pacientes/${t.paciente.id}`}
                    className="text-xs text-brand-700 hover:underline"
                  >
                    Ver
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
