"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Loader2, Sparkles } from "lucide-react";

type TurnoOpt = { id: number; inicio: string };

function formatTurno(inicio: string) {
  return new Date(inicio).toLocaleString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function TurnoSelect({
  turnos,
  value,
  onChange,
}: {
  turnos: TurnoOpt[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sorted = [...turnos].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );
  const selected = sorted.find((t) => String(t.id) === value);
  const label = selected ? formatTurno(selected.inicio) : "— Sin vincular —";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left cursor-pointer"
      >
        <span className={selected ? "text-ink-800" : "text-ink-400"}>{label}</span>
        <ChevronDown className={`w-4 h-4 text-ink-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-ink-200 rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-52 overflow-y-auto divide-y divide-ink-100">
            <li>
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-ink-50 flex items-center gap-2 ${!value ? "text-ink-700 font-medium" : "text-ink-400"}`}
              >
                {!value && <Check className="w-3.5 h-3.5 text-brand-600" />}
                <span className={!value ? "ml-0" : "ml-5"}>— Sin vincular —</span>
              </button>
            </li>
            {sorted.map((t) => {
              const isSelected = String(t.id) === value;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(String(t.id)); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 flex items-center gap-2 ${isSelected ? "text-brand-700 font-medium bg-brand-50" : "text-ink-700"}`}
                  >
                    {isSelected
                      ? <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      : <span className="w-3.5 h-3.5 shrink-0" />}
                    {formatTurno(t.inicio)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

type NuevaSesion = {
  id: number;
  fecha: string;
  tipo: string;
  resumen: string;
  objetivos: string | null;
  proximosPasos: string | null;
};

const PLANTILLAS = [
  { label: "DBT", text: "Habilidades trabajadas:\n• Mindfulness: \n• Reg. emocional: \n• Tolerancia al malestar: \n• Ef. interpersonal: " },
  { label: "TCC", text: "Técnica aplicada:\n\nPensamientos automáticos trabajados:\n\nReestructuración cognitiva:\n\nTarea para el hogar:" },
  { label: "1ª entrevista", text: "Motivo de consulta referido:\n\nHistoria del problema:\n\nImpresión diagnóstica preliminar:\n\nObjetivos iniciales:" },
  { label: "Cierre", text: "Sesión de cierre.\n\nLogros del proceso:\n\nObjetivos alcanzados:\n\nRecomendaciones:" },
];

export default function SessionForm({
  pacienteId,
  turnos,
  initialFecha,
  initialTurnoId,
  onSaved,
}: {
  pacienteId: number;
  turnos: TurnoOpt[];
  initialFecha?: string;
  initialTurnoId?: string;
  onSaved?: (sesion: NuevaSesion) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  // Scroll automático: cuando viene de un turno (initialFecha) o del hash #nueva-sesion
  useEffect(() => {
    const shouldScroll =
      initialFecha ||
      (typeof window !== "undefined" && window.location.hash === "#nueva-sesion");
    if (shouldScroll) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [initialFecha]);

  const [fecha, setFecha] = useState(() =>
    initialFecha ?? new Date().toLocaleString("sv", { timeZone: "America/Argentina/Buenos_Aires" }).replace(" ", "T").slice(0, 16)
  );
  const [resumen, setResumen] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [proximosPasos, setProximosPasos] = useState("");
  const [turnoId, setTurnoId] = useState<string>(initialTurnoId ?? "");
  const [saving, setSaving] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generarConIA() {
    if (!resumen.trim()) {
      setErr("Escribí algunas notas antes de generar el resumen.");
      return;
    }
    setGenerando(true);
    setErr(null);
    try {
      const res = await fetch("/api/ia/resumen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas: resumen }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al generar el resumen");
      setResumen(data.resumen);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setGenerando(false);
    }
  }

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
      const nueva: NuevaSesion = await res.json();
      setResumen("");
      setObjetivos("");
      setProximosPasos("");
      setTurnoId("");
      onSaved?.(nueva);
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
          <TurnoSelect turnos={turnos} value={turnoId} onChange={setTurnoId} />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <label className="label !mb-0">Resumen de la sesión *</label>
          <span className="text-[10px] text-ink-400 ml-auto">Plantilla:</span>
          {PLANTILLAS.map((p) => (
            <button
              type="button"
              key={p.label}
              onClick={() => setResumen(p.text)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700 transition bg-white"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={generarConIA}
            disabled={generando}
            className="ml-1 text-[11px] px-2.5 py-0.5 rounded-full border border-brand-300 text-brand-700 bg-brand-50 hover:bg-brand-100 transition inline-flex items-center gap-1 disabled:opacity-50"
          >
            {generando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generando ? "Generando…" : "IA"}
          </button>
        </div>
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
      <button className="btn-primary inline-flex items-center gap-2" disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? "Guardando…" : "Guardar sesión"}
      </button>
    </form>
  );
}
