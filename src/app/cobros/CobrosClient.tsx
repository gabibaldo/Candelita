"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CheckSquare, Square } from "lucide-react";
import Avatar from "@/components/Avatar";
import { formatMoney } from "@/lib/utils";

export type TurnoCobro = {
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

export default function CobrosClient({ turnos: initialTurnos }: { turnos: TurnoCobro[] }) {
  const [turnos, setTurnos] = useState<TurnoCobro[]>(initialTurnos);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  async function cobrarId(id: number) {
    setTurnos((prev) => prev.filter((t) => t.id !== id));
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    await fetch(`/api/turnos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cobrado: true }),
    });
  }

  async function cobrarSeleccionados() {
    const ids = Array.from(selected);
    setTurnos((prev) => prev.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
    await Promise.all(ids.map((id) =>
      fetch(`/api/turnos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cobrado: true }),
      })
    ));
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function toggleAll() {
    if (selected.size === turnos.length) setSelected(new Set());
    else setSelected(new Set(turnos.map((t) => t.id)));
  }

  // Agrupar por paciente
  const byPaciente = new Map<number, { paciente: TurnoCobro["paciente"]; turnos: TurnoCobro[] }>();
  for (const t of turnos) {
    if (!byPaciente.has(t.paciente.id)) {
      byPaciente.set(t.paciente.id, { paciente: t.paciente, turnos: [] });
    }
    byPaciente.get(t.paciente.id)!.turnos.push(t);
  }
  const grupos = Array.from(byPaciente.values()).sort((a, b) =>
    a.paciente.apellido.localeCompare(b.paciente.apellido)
  );

  const totalSeleccionado = turnos
    .filter((t) => selected.has(t.id))
    .reduce((a, t) => a + (t.importe ?? t.paciente.importeSesion), 0);

  if (turnos.length === 0) {
    return (
      <div className="card p-10 text-center text-ink-400">
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-sage-400" />
        <p className="font-medium text-ink-600">Todo al día</p>
        <p className="text-sm mt-1">No hay turnos pendientes de cobro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-ink-500">{turnos.length} turno{turnos.length !== 1 ? "s" : ""} pendientes</p>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-800 transition"
          >
            {selected.size === turnos.length
              ? <CheckSquare className="w-3.5 h-3.5" />
              : <Square className="w-3.5 h-3.5" />
            }
            {selected.size === turnos.length ? "Deseleccionar todos" : "Seleccionar todos"}
          </button>
          {selected.size > 0 && (
            <button
              onClick={cobrarSeleccionados}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-sage-600 text-white hover:bg-sage-700 transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Cobrar {selected.size} · {formatMoney(totalSeleccionado)}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {grupos.map(({ paciente, turnos: gTurnos }) => {
          const subtotal = gTurnos.reduce((a, t) => a + (t.importe ?? t.paciente.importeSesion), 0);
          return (
            <div key={paciente.id} className="card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-ink-100 bg-ink-50/50 flex items-center gap-3">
                <Avatar nombre={paciente.nombre} apellido={paciente.apellido} size="sm" />
                <p className="font-medium text-ink-800 flex-1">
                  {paciente.apellido}, {paciente.nombre}
                </p>
                <p className="text-sm font-semibold text-amber-700">{formatMoney(subtotal)}</p>
                <Link
                  href={`/pacientes/${paciente.id}`}
                  className="text-xs text-brand-700 hover:underline"
                >
                  Ver ficha →
                </Link>
              </div>
              <ul className="divide-y divide-ink-100">
                {gTurnos.map((t) => {
                  const monto = t.importe ?? t.paciente.importeSesion;
                  const isSelected = selected.has(t.id);
                  return (
                    <li
                      key={t.id}
                      className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition ${
                        isSelected ? "bg-amber-50/60" : "hover:bg-ink-50/50"
                      }`}
                      onClick={() => toggle(t.id)}
                    >
                      <div className="shrink-0">
                        {isSelected
                          ? <CheckSquare className="w-4 h-4 text-amber-500" />
                          : <Square className="w-4 h-4 text-ink-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-700">
                          {new Date(t.inicio).toLocaleString("es-AR", {
                            weekday: "short", day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                            timeZone: "America/Argentina/Buenos_Aires",
                          })}
                        </p>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                          t.estado === "realizado"
                            ? "bg-sage-100 text-sage-700"
                            : "bg-brand-100 text-brand-700"
                        }`}>
                          {t.estado}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-semibold text-amber-700">{formatMoney(monto)}</p>
                        <button
                          onClick={() => cobrarId(t.id)}
                          className="text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 transition"
                        >
                          Cobrar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
