"use client";
import { useState } from "react";
import { StickyNote, X, ChevronDown } from "lucide-react";
import PatientCombobox from "@/components/PatientCombobox";

type Paciente = { id: number; nombre: string; apellido: string };

export default function QuickNote({ pacientes }: { pacientes: Paciente[] }) {
  const [open, setOpen] = useState(false);
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  async function guardar() {
    if (pacienteId == null || !texto.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId: Number(pacienteId),
          fecha: new Date().toISOString(),
          tipo: "nota",
          resumen: texto.trim(),
        }),
      });
      setTexto("");
      setPacienteId(null);
      setOk(true);
      setTimeout(() => { setOk(false); setOpen(false); }, 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost flex items-center gap-1.5"
      >
        <StickyNote className="w-4 h-4" />
        Nota rápida
        <ChevronDown className={"w-3.5 h-3.5 transition " + (open ? "rotate-180" : "")} />
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 bg-white border border-ink-200 rounded-xl shadow-lg w-72 sm:w-80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-800">Nota rápida</p>
            <button onClick={() => setOpen(false)} className="btn-icon !p-1 text-ink-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <PatientCombobox
            pacientes={pacientes}
            value={pacienteId}
            onChange={setPacienteId}
            placeholder="Buscar paciente…"
          />
          <textarea
            className="textarea text-sm"
            rows={4}
            placeholder="Escribí tu nota clínica…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          {ok ? (
            <p className="text-sm text-sage-700 font-medium text-center">✓ Guardado</p>
          ) : (
            <button
              className="btn-primary w-full text-sm"
              disabled={pacienteId == null || !texto.trim() || saving}
              onClick={guardar}
            >
              {saving ? "Guardando…" : "Guardar nota"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
