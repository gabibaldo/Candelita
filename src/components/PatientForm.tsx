"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type PatientFormData = {
  id?: number;
  nombre: string;
  apellido: string;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  tutorNombre?: string | null;
  tutorTelefono?: string | null;
  tutorDni?: string | null;
  tutorRelacion?: string | null;
  tipo: "particular" | "obra_social";
  obraSocialNombre?: string | null;
  numeroAfiliado?: string | null;
  sesionesAutorizadas?: number | string | null;
  importeSesion?: number | string | null;
  motivoConsulta?: string | null;
  diagnostico?: string | null;
  objetivosTerapeuticos?: string | null;
  notasGenerales?: string | null;
  activo?: boolean;
};

export default function PatientForm({ initial }: { initial?: PatientFormData }) {
  const router = useRouter();
  const [data, setData] = useState<PatientFormData>(
    initial ?? {
      nombre: "",
      apellido: "",
      tipo: "particular",
      importeSesion: 0,
      activo: true,
    }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof PatientFormData>(
    k: K,
    v: PatientFormData[K]
  ) => setData((d) => ({ ...d, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const { id: _id, ...payload } = data;
      const isEdit = !!initial?.id;
      const url = isEdit ? `/api/pacientes/${initial!.id}` : "/api/pacientes";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(
          typeof d.error === "string" ? d.error : "No pude guardar el paciente"
        );
      }
      const saved = await res.json();
      router.push(`/pacientes/${saved.id}`);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isOS = data.tipo === "obra_social";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-5">
        <h3 className="font-semibold text-brand-800 mb-3">Datos básicos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Apellido *</label>
            <input
              className="input"
              value={data.apellido}
              onChange={(e) => set("apellido", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input"
              value={data.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input
              type="date"
              className="input"
              value={
                data.fechaNacimiento
                  ? String(data.fechaNacimiento).slice(0, 10)
                  : ""
              }
              onChange={(e) => set("fechaNacimiento", e.target.value || null)}
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              className="input"
              value={data.telefono ?? ""}
              onChange={(e) => set("telefono", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={data.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input
              className="input"
              value={data.direccion ?? ""}
              onChange={(e) => set("direccion", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-semibold text-brand-800 mb-3">
          Tutor / responsable
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre del tutor</label>
            <input
              className="input"
              value={data.tutorNombre ?? ""}
              onChange={(e) => set("tutorNombre", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Relación</label>
            <input
              className="input"
              placeholder="madre, padre, abuela…"
              value={data.tutorRelacion ?? ""}
              onChange={(e) => set("tutorRelacion", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Teléfono del tutor</label>
            <input
              className="input"
              value={data.tutorTelefono ?? ""}
              onChange={(e) => set("tutorTelefono", e.target.value)}
            />
          </div>
          <div>
            <label className="label">DNI del tutor</label>
            <input
              className="input"
              value={data.tutorDni ?? ""}
              onChange={(e) => set("tutorDni", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-semibold text-brand-800 mb-3">Tipo de atención</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Modalidad *</label>
            <select
              className="input"
              value={data.tipo}
              onChange={(e) =>
                set("tipo", e.target.value as "particular" | "obra_social")
              }
            >
              <option value="particular">Particular</option>
              <option value="obra_social">Obra social</option>
            </select>
          </div>
          <div>
            <label className="label">Importe por sesión (ARS)</label>
            <input
              type="number"
              min={0}
              step={500}
              className="input"
              value={data.importeSesion ?? 0}
              onChange={(e) => set("importeSesion", e.target.value)}
            />
          </div>
          {isOS && (
            <>
              <div>
                <label className="label">Obra social</label>
                <input
                  className="input"
                  value={data.obraSocialNombre ?? ""}
                  onChange={(e) => set("obraSocialNombre", e.target.value)}
                />
              </div>
              <div>
                <label className="label">N° de afiliado</label>
                <input
                  className="input"
                  value={data.numeroAfiliado ?? ""}
                  onChange={(e) => set("numeroAfiliado", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Sesiones autorizadas</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={data.sesionesAutorizadas ?? ""}
                  onChange={(e) =>
                    set("sesionesAutorizadas", e.target.value || null)
                  }
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-semibold text-brand-800 mb-3">
          Información clínica
        </h3>
        <div className="space-y-4">
          <div>
            <label className="label">Motivo de consulta</label>
            <textarea
              className="textarea"
              value={data.motivoConsulta ?? ""}
              onChange={(e) => set("motivoConsulta", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Diagnóstico / hipótesis</label>
            <textarea
              className="textarea"
              value={data.diagnostico ?? ""}
              onChange={(e) => set("diagnostico", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Objetivos terapéuticos</label>
            <textarea
              className="textarea"
              value={data.objetivosTerapeuticos ?? ""}
              onChange={(e) => set("objetivosTerapeuticos", e.target.value)}
              placeholder="Metas del proceso terapéutico…"
            />
          </div>
          <div>
            <label className="label">Notas generales</label>
            <textarea
              className="textarea"
              value={data.notasGenerales ?? ""}
              onChange={(e) => set("notasGenerales", e.target.value)}
            />
          </div>
          {initial?.id && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.activo ?? true}
                onChange={(e) => set("activo", e.target.checked)}
              />
              Paciente activo
            </label>
          )}
        </div>
      </section>

      {err && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {err}
        </p>
      )}

      <div className="flex gap-3">
        <button className="btn-primary" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.back()}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
