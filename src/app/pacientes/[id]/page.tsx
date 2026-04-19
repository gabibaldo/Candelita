import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { edadDesde, formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import SessionForm from "@/components/SessionForm";
import DeletePatientButton from "@/components/DeletePatientButton";
import SessionList from "@/components/SessionList";
import ArchivosSection from "@/components/ArchivosSection";

export const dynamic = "force-dynamic";

export default async function PacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      sesiones: { orderBy: { fecha: "desc" } },
      turnos: {
        orderBy: { inicio: "desc" },
        take: 30,
        include: { sesion: { select: { id: true } } },
      },
    },
  });
  if (!paciente) notFound();

  const edad = edadDesde(paciente.fechaNacimiento);
  const isOS = paciente.tipo === "obra_social";

  return (
    <div className="space-y-6">
      <Link href="/pacientes" className="md:hidden inline-flex items-center gap-1 text-sm text-brand-700 hover:underline -mb-2">
        <ChevronLeft className="w-4 h-4" /> Pacientes
      </Link>
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-ink-500 hidden md:block">Paciente</p>
          <h1 className="text-2xl font-semibold text-brand-800">
            {paciente.apellido}, {paciente.nombre}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {edad != null && (
              <span className="text-xs text-ink-500">{edad} años</span>
            )}
            <span
              className={
                "chip " +
                (isOS
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800")
              }
            >
              {isOS
                ? `Obra social · ${paciente.obraSocialNombre ?? "—"}`
                : "Particular"}
            </span>
            {!paciente.activo && (
              <span className="chip bg-ink-200 text-ink-700">inactivo</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/api/historia/${paciente.id}/pdf`}
            target="_blank"
            className="btn-ghost"
          >
            Exportar PDF
          </Link>
          <Link
            href={`/pacientes/${paciente.id}/editar`}
            className="btn-ghost"
          >
            Editar
          </Link>
          <DeletePatientButton id={paciente.id} />
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 md:col-span-2">
          <h3 className="font-semibold text-brand-800 mb-3">Ficha</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
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
                <Item
                  label="Sesiones autorizadas"
                  value={paciente.sesionesAutorizadas?.toString() ?? "—"}
                />
              </>
            )}
            <Item
              label="Importe por sesión"
              value={formatMoney(paciente.importeSesion)}
            />
          </dl>
          {paciente.motivoConsulta && (
            <div className="mt-4">
              <p className="text-xs font-medium text-ink-500">
                Motivo de consulta
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {paciente.motivoConsulta}
              </p>
            </div>
          )}
          {paciente.diagnostico && (
            <div className="mt-3">
              <p className="text-xs font-medium text-ink-500">
                Diagnóstico / hipótesis
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {paciente.diagnostico}
              </p>
            </div>
          )}
          {paciente.objetivosTerapeuticos && (
            <div className="mt-3">
              <p className="text-xs font-medium text-brand-600">
                Objetivos terapéuticos
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {paciente.objetivosTerapeuticos}
              </p>
            </div>
          )}
          {paciente.notasGenerales && (
            <div className="mt-3">
              <p className="text-xs font-medium text-ink-500">
                Notas generales
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {paciente.notasGenerales}
              </p>
            </div>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-brand-800 mb-3">Agenda</h3>
          {paciente.turnos.length === 0 ? (
            <p className="text-sm text-ink-500">Sin turnos aún.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {paciente.turnos.slice(0, 10).map((t) => {
                const sinSesion = t.estado === "realizado" && !t.sesion;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs text-ink-500">
                        {formatDateTime(t.inicio)}
                      </span>
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
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href={`/calendario?paciente=${paciente.id}`}
            className="text-xs text-brand-700 hover:underline mt-3 inline-block"
          >
            Ver en calendario →
          </Link>
        </div>
      </section>

      <ArchivosSection pacienteId={paciente.id} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Historia clínica ({paciente.sesiones.length} sesiones)
        </h2>
        <SessionForm
          pacienteId={paciente.id}
          turnos={paciente.turnos.map((t) => ({
            id: t.id,
            inicio: t.inicio.toISOString(),
            estado: t.estado,
          }))}
        />
        <SessionList
          initialSesiones={paciente.sesiones.map((s) => ({
            id: s.id,
            fecha: s.fecha.toISOString(),
            resumen: s.resumen,
            objetivos: s.objetivos ?? null,
            proximosPasos: s.proximosPasos ?? null,
          }))}
        />
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
