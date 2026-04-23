"use client";
import { useState } from "react";
import { Pencil, Trash2, Check, X, FileText } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatDateTime } from "@/lib/utils";

type Sesion = {
  id: number;
  fecha: string;
  tipo: string;
  resumen: string;
  objetivos: string | null;
  proximosPasos: string | null;
};

function EditForm({
  sesion,
  onSave,
  onCancel,
}: {
  sesion: Sesion;
  onSave: (updated: Sesion) => void;
  onCancel: () => void;
}) {
  const [resumen, setResumen] = useState(sesion.resumen);
  const [objetivos, setObjetivos] = useState(sesion.objetivos ?? "");
  const [proximosPasos, setProximosPasos] = useState(sesion.proximosPasos ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumen.trim()) { setErr("El resumen es obligatorio."); return; }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/sesiones/${sesion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumen: resumen.trim(),
          objetivos: objetivos.trim() || null,
          proximosPasos: proximosPasos.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar.");
      onSave({
        ...sesion,
        resumen: resumen.trim(),
        objetivos: objetivos.trim() || null,
        proximosPasos: proximosPasos.trim() || null,
      });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 mt-2">
      <div>
        <label className="label">Resumen *</label>
        <textarea
          className="textarea min-h-[120px]"
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary text-sm py-1.5" disabled={saving}>
          <Check className="w-3.5 h-3.5" />
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="btn-ghost text-sm py-1.5" onClick={onCancel} disabled={saving}>
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
      </div>
    </form>
  );
}

function SesionCard({ sesion, onUpdated, onDeleted }: {
  sesion: Sesion;
  onUpdated: (s: Sesion) => void;
  onDeleted: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { confirm, toast } = useToast();

  async function handleDelete() {
    const ok = await confirm({
      title: "¿Eliminar esta sesión?",
      description: "Se eliminará de la historia clínica. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await fetch(`/api/sesiones/${sesion.id}`, { method: "DELETE" });
      onDeleted(sesion.id);
      toast("Sesión eliminada", "info");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ink-700 text-sm">
          {formatDateTime(sesion.fecha)}
        </p>
        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="btn-icon !p-1.5 text-ink-400 hover:text-brand-700"
              title="Editar sesión"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-icon !p-1.5 text-ink-400 hover:text-red-600"
              title="Eliminar sesión"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <EditForm
          sesion={sesion}
          onSave={(updated) => { onUpdated(updated); setEditing(false); toast("Sesión actualizada", "success"); }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 mb-1">
            {sesion.tipo === "nota" ? "Nota" : "Resumen"}
          </p>
          <p className="text-sm whitespace-pre-wrap text-ink-800">{sesion.resumen}</p>
          {sesion.objetivos && (
            <p className="text-sm">
              <span className="font-medium text-ink-600">Objetivos: </span>
              {sesion.objetivos}
            </p>
          )}
          {sesion.proximosPasos && (
            <p className="text-sm">
              <span className="font-medium text-ink-600">Próximos pasos: </span>
              {sesion.proximosPasos}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionList({
  sesiones,
  onUpdated,
  onDeleted,
}: {
  sesiones: Sesion[];
  onUpdated: (s: Sesion) => void;
  onDeleted: (id: number) => void;
}) {
  if (sesiones.length === 0) {
    return (
      <div className="card p-6 text-sm text-ink-500 text-center flex flex-col items-center gap-2">
        <FileText className="w-8 h-8 text-ink-300" />
        Todavía no hay sesiones cargadas.
      </div>
    );
  }

  return (
    <ul className="space-y-0">
      {sesiones.map((s, i) => (
        <li key={s.id} className="flex gap-4">
          {/* Timeline */}
          <div className="flex flex-col items-center shrink-0 w-5">
            <div className="w-3 h-3 rounded-full bg-brand-400 border-2 border-white ring-1 ring-brand-300 mt-4 shrink-0 z-10" />
            {i < sesiones.length - 1 && (
              <div className="w-0.5 flex-1 bg-ink-200 mt-1" />
            )}
          </div>
          {/* Card */}
          <div className="flex-1 pb-4">
            <SesionCard
              sesion={s}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
