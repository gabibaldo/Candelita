import Link from "next/link";
import { notFound } from "next/navigation";
import ExportPDFButton from "@/components/ExportPDFButton";
import { prisma } from "@/lib/db";
import { edadDesde, formatDate, formatDateTime } from "@/lib/utils";
import { ArrowLeft, CalendarDays, FileText, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HistoriaPage({
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
      sesiones: {
        orderBy: { fecha: "desc" },
        include: {
          turno: { select: { inicio: true, estado: true, cobrado: true } },
        },
      },
      _count: { select: { turnos: true, sesiones: true } },
    },
  });
  if (!paciente) notFound();

  const isOS = paciente.tipo === "obra_social";
  const edad = edadDesde(paciente.fechaNacimiento);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Cabecera */}
      <header className="space-y-3">
        <Link
          href={`/pacientes/${paciente.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a la ficha
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-brand-500" />
              <span className="text-xs text-brand-600 font-semibold uppercase tracking-wider">
                Historia clínica
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-brand-800">
              {paciente.apellido}, {paciente.nombre}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {edad != null && (
                <span className="text-sm text-ink-500">{edad} años</span>
              )}
              {paciente.fechaNacimiento && (
                <span className="text-sm text-ink-500">
                  · Nac. {formatDate(paciente.fechaNacimiento)}
                </span>
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
                  ? `OS · ${paciente.obraSocialNombre ?? "—"}`
                  : "Particular"}
              </span>
            </div>
            {paciente.diagnostico && (
              <p className="text-sm text-ink-600 mt-2 italic">
                {paciente.diagnostico}
              </p>
            )}
          </div>
          <ExportPDFButton pacienteId={paciente.id} />
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-ink-500">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {paciente._count.sesiones}{" "}
            {paciente._count.sesiones === 1 ? "sesión cargada" : "sesiones cargadas"}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {paciente._count.turnos} turnos en total
          </span>
        </div>
      </header>

      {/* Datos clínicos relevantes */}
      {(paciente.motivoConsulta || paciente.diagnostico || paciente.objetivosTerapeuticos) && (
        <section className="card p-5 space-y-4">
          {paciente.motivoConsulta && (
            <div>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">
                Motivo de consulta
              </p>
              <p className="text-sm text-ink-800 whitespace-pre-wrap">
                {paciente.motivoConsulta}
              </p>
            </div>
          )}
          {paciente.diagnostico && (
            <div className={paciente.motivoConsulta ? "border-t border-ink-100 pt-3" : ""}>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">
                Diagnóstico / hipótesis
              </p>
              <p className="text-sm text-ink-800 whitespace-pre-wrap">
                {paciente.diagnostico}
              </p>
            </div>
          )}
          {paciente.objetivosTerapeuticos && (
            <div className="border-t border-ink-100 pt-3">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
                Objetivos terapéuticos
              </p>
              <p className="text-sm text-ink-800 whitespace-pre-wrap">
                {paciente.objetivosTerapeuticos}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Sesiones */}
      {paciente.sesiones.length === 0 ? (
        <div className="card p-10 text-center">
          <FileText className="w-10 h-10 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-500 font-medium">Sin sesiones registradas</p>
          <p className="text-sm text-ink-400 mt-1">
            Las sesiones clínicas aparecerán aquí una vez cargadas.
          </p>
          <Link
            href={`/pacientes/${paciente.id}?tab=historia`}
            className="btn-primary mt-4 inline-flex"
          >
            Cargar primera sesión
          </Link>
        </div>
      ) : (
        <ol className="relative border-l-2 border-brand-100 ml-3 space-y-0">
          {paciente.sesiones.map((s, i) => {
            const isLast = i === paciente.sesiones.length - 1;
            return (
              <li key={s.id} className="ml-6 pb-8">
                {/* Punto en la línea */}
                <span className="absolute -left-[9px] w-4 h-4 rounded-full border-2 border-brand-400 bg-white flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                </span>

                {/* Fecha */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <time className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">
                    {formatDateTime(s.fecha)}
                  </time>
                  {s.turno && (
                    <span
                      className={
                        "chip text-xs " +
                        (s.turno.cobrado
                          ? "bg-sage-100 text-sage-700"
                          : "bg-amber-100 text-amber-700")
                      }
                    >
                      {s.turno.cobrado ? "cobrado" : "sin cobrar"}
                    </span>
                  )}
                </div>

                {/* Contenido */}
                <div className="card p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1.5">
                      {(s as any).tipo === "nota" ? "Nota" : "Resumen"}
                    </p>
                    <p className="text-sm text-ink-800 whitespace-pre-wrap leading-relaxed">
                      {s.resumen}
                    </p>
                  </div>

                  {s.objetivos && (
                    <div className="border-t border-ink-100 pt-3">
                      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1.5">
                        Objetivos
                      </p>
                      <p className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">
                        {s.objetivos}
                      </p>
                    </div>
                  )}

                  {s.proximosPasos && (
                    <div className="border-t border-ink-100 pt-3">
                      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1.5">
                        Próximos pasos
                      </p>
                      <p className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">
                        {s.proximosPasos}
                      </p>
                    </div>
                  )}
                </div>

                {isLast && <div className="h-1" />}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
