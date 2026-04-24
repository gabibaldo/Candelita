import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { edadDesde } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import DeletePatientButton from "@/components/DeletePatientButton";
import PacienteTabs from "@/components/PacienteTabs";
import ExportPDFButton from "@/components/ExportPDFButton";

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

  // Serializar fechas para el client component
  const pacienteSerial = {
    id: paciente.id,
    nombre: paciente.nombre,
    apellido: paciente.apellido,
    fechaNacimiento: paciente.fechaNacimiento?.toISOString() ?? null,
    telefono: paciente.telefono,
    celular: (paciente as any).celular ?? null,
    email: paciente.email,
    direccion: paciente.direccion,
    tutorNombre: paciente.tutorNombre,
    tutorTelefono: paciente.tutorTelefono,
    tutorDni: paciente.tutorDni,
    tutorRelacion: paciente.tutorRelacion,
    tipo: paciente.tipo,
    obraSocialNombre: paciente.obraSocialNombre,
    numeroAfiliado: paciente.numeroAfiliado,
    sesionesAutorizadas: paciente.sesionesAutorizadas,
    importeSesion: paciente.importeSesion,
    motivoConsulta: paciente.motivoConsulta,
    diagnostico: paciente.diagnostico,
    objetivosTerapeuticos: paciente.objetivosTerapeuticos,
    notasGenerales: paciente.notasGenerales,
    turnos: paciente.turnos.map((t) => ({
      id: t.id,
      inicio: t.inicio.toISOString(),
      estado: t.estado,
      confirmado: t.confirmado,
      cobrado: t.cobrado,
      sesion: t.sesion ?? null,
    })),
    sesiones: paciente.sesiones.map((s) => ({
      id: s.id,
      fecha: s.fecha.toISOString(),
      tipo: (s as any).tipo ?? "sesion",
      resumen: s.resumen,
      objetivos: s.objetivos ?? null,
      proximosPasos: s.proximosPasos ?? null,
    })),
  };

  return (
    <div className="space-y-6">
      <Link
        href="/pacientes"
        className="md:hidden inline-flex items-center gap-1 text-sm text-brand-700 hover:underline -mb-2"
      >
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
          <ExportPDFButton pacienteId={paciente.id} />
          <Link
            href={`/pacientes/${paciente.id}/editar`}
            className="btn-ghost"
          >
            Editar
          </Link>
          <DeletePatientButton id={paciente.id} />
        </div>
      </header>

      <PacienteTabs paciente={pacienteSerial} />
    </div>
  );
}
