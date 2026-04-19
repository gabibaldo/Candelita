"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type TurnoOpt = { id: number; inicio: string; estado: string };

export default function SessionForm({
  pacienteId,
  turnos,
}: {
  pacienteId: number;
  turnos: TurnoOpt[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Scroll automático cuando se navega con el hash #nueva-sesion
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#nueva-sesion") {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [resumen, setResumen] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [proximosPasos, setProximosPasos] = useState("");
  const [turnoId, setTurnoId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumen.trim()) {
      setErr("El resumen es obligatorio.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId,
          turnoId: turnoId ? Number(turnoId) : null,
          fecha: new Date(fecha).toISOString(),
          resumen,
          objetivos: objetivos || null,
          proximosPasos: proximosPasos || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(
          typeof d.error === "string" ? d.error : "No pude guardar la sesión"
        );
      }
      setResumen("");
      setObjetivos("");
      setProximosPasos("");
      setTurnoId("");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      id="nueva-sesion"
      ref={formRef}
      onSubmit={onSubmit}
      className="card p-5 space-y-4 scroll-mt-28"
    >
      <h3 className="font-semibold text-brand-800">Cargar sesión</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Fecha y hora</label>
          <input
            type="datetime-local"
            className="input"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Vincular a turno (opcional)</label>
          <select
            className="input"
            value={turnoId}
            onChange={(e) => setTurnoId(e.target.value)}
          >
            <option value="">— Sin vincular —</option>
            {turnos.map((t) => (
              <option key={t.id} value={t.id}>
                {new Date(t.inicio).toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {t.estado}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Resumen de la sesión *</label>
        <textarea
          className="textarea min-h-[140px]"
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
          placeholder="Observaciones, técnicas aplicadas, evolución, emergentes…"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Objetivos trabajados</label>
          <textarea
            className="textarea"
            value={objetivos}
            onChange={(e) => setObjetivos(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Próximos pasos</label>
          <textarea
            className="textarea"
            value={proximosPasos}
            onChange={(e) => setProximosPasos(e.target.value)}
          />
        </div>
      </div>
      {err && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {err}
        </p>
      )}
      <button className="btn-primary" disabled={saving}>
        {saving ? "Guardando…" : "Guardar sesión"}
      </button>
    </form>
  );
}
