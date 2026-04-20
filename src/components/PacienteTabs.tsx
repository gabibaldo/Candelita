"use client";
import { useState } from "react";
import { User, CalendarDays, FileText, Paperclip } from "lucide-react";
import Link from "next/link";
import SessionForm from "@/components/SessionForm";
import SessionList from "@/components/SessionList";
import ArchivosSection from "@/components/ArchivosSection";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";

type Tab = "info" | "turnos" | "historia" | "archivos";

type Turno = {
  id: number;
  inicio: string;
  estado: string;
  confirmado: boolean;
  cobrado: boolean;
  sesion: { id: number } | null;
};

type Sesion = {
  id: number;
  fecha: string;
  resumen: string;
  objetivos: string | null;
  proximosPasos: string | null;
};

type Paciente = {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  tutorNombre: string | null;
  tutorTelefono: string | null;
  tutorDni: string | null;
  tutorRelacion: string | null;
  tipo: string;
  obraSocialNombre: string | null;
  numeroAfiliado: string | null;
  sesionesAutorizadas: number | null;
  importeSesion: number | null;
  motivoConsulta: string | null;
  diagnostico: string | null;
  objetivosTerapeuticos: string | null;
  notasGenerales: string | null;
  turnos: Turno[];
  sesiones: Sesion[];
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "info",    label: "Información",    icon: User },
  { key: "turnos",  label: "Turnos",         icon: CalendarDays },
  { key: "historia",label: "Historia clínica", icon: FileText },
  { key: "archivos",label: "Archivos",       icon: Paperclip },
];

export default function PacienteTabs({ paciente }: { paciente: Paciente }) {
  const [tab, setTab] = useState<Tab>("info");
  const isOS = paciente.tipo === "obra_social";

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex border-b border-ink-200 overflow-x-auto scrollbar-none -mb-px">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 " +
              (tab === key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300")
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {key === "historia" && paciente.sesiones.length > 0 && (
              <span className="ml-1 text-[10px] bg-brand-100 text-brand-700 rounded-full px-1.5 py-0.5 font-semibold leading-none">
                {paciente.sesiones.length}
              </span>
            )}
            {key === "turnos" && paciente.turnos.length > 0 && (
              <span className="ml-1 text-[10px] bg-ink-100 text-ink-600 rounded-full px-1.5 py-0.5 font-semibold leading-none">
                {paciente.turnos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-5">

        {/* ── Información ── */}
        {tab === "info" && (
          <div className="card p-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Item label="Fecha de nacimiento" value={formatDate(paciente.fechaNacimiento)} />
              <Item label="Teléfono" value={paciente.telefono ?? "—"} />
              <Item label="Email" value={paciente.email ?? "—"} />
              <Item label="Dirección" value={paciente.direccion ?? "—"} />
              <Item label="Tutor" value={paciente.tutorNombre ?? "—"} />
              <Item label="Tel. tutor" value={paciente.tutorTelefono ?? "—"} />
              <Item label="DNI tutor" value={paciente.tutorDni ?? "—"} />
              <Item label="Relación" value={paciente.tutorRelacion ?? "—"} />
              {isOS && (
                <>
                  <Item label="N° afiliado" value={paciente.numeroAfiliado ?? "—"} />
                  <Item label="Sesiones autorizadas" value={paciente.sesionesAutorizadas?.toString() ?? "—"} />
                </>
              )}
              <Item label="Importe por sesión" value={formatMoney(paciente.importeSesion)} />
            </dl>

            {paciente.motivoConsulta && (
              <div className="mt-5 pt-4 border-t border-ink-100">
                <p className="text-xs font-medium text-ink-500 mb-1">Motivo de consulta</p>
                <p className="text-sm whitespace-pre-wrap">{paciente.motivoConsulta}</p>
              </div>
            )}
            {paciente.diagnostico && (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-500 mb-1">Diagnóstico / hipótesis</p>
                <p className="text-sm whitespace-pre-wrap">{paciente.diagnostico}</p>
              </div>
            )}
            {paciente.objetivosTerapeuticos && (
              <div className="mt-4">
                <p className="text-xs font-medium text-brand-600 mb-1">Objetivos terapéuticos</p>
                <p className="text-sm whitespace-pre-wrap">{paciente.objetivosTerapeuticos}</p>
              </div>
            )}
            {paciente.notasGenerales && (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-500 mb-1">Notas generales</p>
                <p className="text-sm whitespace-pre-wrap">{paciente.notasGenerales}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Turnos ── */}
        {tab === "turnos" && (
          <div className="space-y-3">
            {paciente.turnos.length === 0 ? (
              <div className="card p-6 text-center text-ink-400">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin turnos aún.</p>
              </div>
            ) : (
              <div className="card divide-y divide-ink-100">
                {paciente.turnos.map((t) => {
                  const sinSesion = t.estado === "realizado" && !t.sesion;
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50/50 transition">
                      <div className="min-w-0">
                        <p className="text-xs text-ink-500">{formatDateTime(t.inicio)}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className={
                            "text-[11px] px-1.5 py-0.5 rounded-full font-medium " +
                            (t.estado === "realizado" ? "bg-sage-100 text-sage-700" :
                             t.estado === "cancelado" || t.estado === "ausente" ? "bg-ink-100 text-ink-500" :
                             "bg-blue-50 text-blue-700")
                          }>
                            {t.estado}
                          </span>
                          {t.confirmado && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">
                              ✓ conf.
                            </span>
                          )}
                          {sinSesion && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                              ⚠ sin sesión
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={
                        "text-xs shrink-0 font-medium " +
                        (t.cobrado ? "text-sage-700" : "text-amber-700")
                      }>
                        {t.cobrado ? "cobrado" : "sin cobrar"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <Link
              href={`/calendario?paciente=${paciente.id}`}
              className="text-xs text-brand-700 hover:underline inline-block"
            >
              Ver en calendario →
            </Link>
          </div>
        )}

        {/* ── Historia clínica ── */}
        {tab === "historia" && (
          <div className="space-y-4">
            <SessionForm
              pacienteId={paciente.id}
              turnos={paciente.turnos.map((t) => ({
                id: t.id,
                inicio: t.inicio,
                estado: t.estado,
              }))}
            />
            <SessionList
              initialSesiones={paciente.sesiones}
            />
          </div>
        )}

        {/* ── Archivos ── */}
        {tab === "archivos" && (
          <ArchivosSection pacienteId={paciente.id} />
        )}
      </div>
    </div>
  );
}
