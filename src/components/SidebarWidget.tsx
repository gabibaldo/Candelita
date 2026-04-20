"use client";
import { useEffect, useState } from "react";
import { Clock, DollarSign, CalendarDays } from "lucide-react";

type TurnoHoy = {
  id: number;
  inicio: string;
  fin: string;
  estado: string;
  cobrado: boolean;
  paciente: { nombre: string; apellido: string };
};

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export default function SidebarWidget() {
  const [turnos, setTurnos] = useState<TurnoHoy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        // Rango de hoy en Argentina
        const now = new Date();
        const hoyStr = now.toLocaleDateString("en-CA", {
          timeZone: "America/Argentina/Buenos_Aires",
        });
        const from = new Date(`${hoyStr}T00:00:00-03:00`).toISOString();
        const to   = new Date(`${hoyStr}T23:59:59-03:00`).toISOString();
        const res = await fetch(`/api/turnos?from=${from}&to=${to}`);
        if (res.ok) setTurnos(await res.json());
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  if (loading) return null;
  if (turnos.length === 0) return null;

  const now = new Date();
  const proximos = turnos
    .filter((t) => new Date(t.inicio) > now && t.estado === "programado")
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());

  const proximo = proximos[0] ?? null;
  const sinCobrar = turnos.filter(
    (t) => t.estado === "realizado" && !t.cobrado
  ).length;
  const totalHoy = turnos.filter(
    (t) => t.estado !== "cancelado" && t.estado !== "ausente"
  ).length;

  return (
    <div className="mx-2 mb-3 rounded-xl bg-brand-50 border border-brand-100 p-3 space-y-2.5">
      {/* Turnos hoy */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-3.5 h-3.5 text-brand-500 shrink-0" />
        <span className="text-xs text-brand-700">
          <span className="font-semibold">{totalHoy}</span> turno{totalHoy !== 1 ? "s" : ""} hoy
        </span>
      </div>

      {/* Próximo turno */}
      {proximo && (
        <div className="flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-800 leading-tight truncate">
              {proximo.paciente.apellido}, {proximo.paciente.nombre}
            </p>
            <p className="text-[11px] text-brand-600">
              {formatHora(proximo.inicio)} – {formatHora(proximo.fin)}
            </p>
          </div>
        </div>
      )}

      {/* Sin cobrar */}
      {sinCobrar > 0 && (
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700">
            <span className="font-semibold">{sinCobrar}</span> sin cobrar hoy
          </span>
        </div>
      )}
    </div>
  );
}
