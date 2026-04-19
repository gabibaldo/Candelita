import { notFound } from "next/navigation";
import PatientForm from "@/components/PatientForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const p = await prisma.paciente.findUnique({ where: { id } });
  if (!p) notFound();

  const initial = {
    id: p.id,
    nombre: p.nombre,
    apellido: p.apellido,
    fechaNacimiento: p.fechaNacimiento
      ? p.fechaNacimiento.toISOString()
      : null,
    telefono: p.telefono,
    email: p.email,
    direccion: p.direccion,
    tutorNombre: p.tutorNombre,
    tutorTelefono: p.tutorTelefono,
    tutorDni: p.tutorDni,
    tutorRelacion: p.tutorRelacion,
    tipo: p.tipo as "particular" | "obra_social",
    obraSocialNombre: p.obraSocialNombre,
    numeroAfiliado: p.numeroAfiliado,
    sesionesAutorizadas: p.sesionesAutorizadas,
    importeSesion: p.importeSesion,
    motivoConsulta: p.motivoConsulta,
    diagnostico: p.diagnostico,
    objetivosTerapeuticos: p.objetivosTerapeuticos,
    notasGenerales: p.notasGenerales,
    activo: p.activo,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-brand-800">Editar paciente</h1>
      <PatientForm initial={initial} />
    </div>
  );
}
