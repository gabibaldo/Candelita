"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed } from "lucide-react";
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

  async function marcarCobrado(turnoId: number) {
    setTurnos((prev) => prev.filter((t) => t.id !== turnoId));
    await fetch(`/api/turnos/${turnoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cobrado: true }),
    });
  }

  if (turnos.length === 0) return null;

  return (
    <section>
      <h2 className="section-title mb-3">
        Deuda pendiente
        <span className="ml-2 text-xs text-amber-600 font-normal normal-case tracking-normal">
          (+{umbralDias} días sin cobrar)
        </span>
      </h2>
      <ul className="card divide-y divide-ink-200/70">
        {turnos.map((t) => {
          const monto = t.importe ?? t.paciente.importeSesion;
          return (
            <li
              key={t.id}
              className="p-3 flex items-center gap-3 hover:bg-ink-50/50 transition"
            >
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
              <div className="shrink-0 flex flex-col items-end gap-1.5">
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
