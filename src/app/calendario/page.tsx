import Calendar from "@/components/Calendar";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams?: Promise<{ paciente?: string; nuevo?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const pacientes = await prisma.paciente.findMany({
    where: { activo: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      apellido: true,
      tipo: true,
      importeSesion: true,
      obraSocialNombre: true,
    },
  });

  const filtro = sp.paciente ? Number(sp.paciente) : undefined;
  const autoOpen = sp.nuevo === "1";

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">Calendario</h1>
          <p className="text-sm text-ink-500 hidden sm:block">
            Arrastrá los turnos para moverlos. Tocá en un hueco para crear uno nuevo.
          </p>
        </div>
      </header>

      <Calendar
        initialPacientes={pacientes}
        initialPacienteFiltro={
          filtro && Number.isFinite(filtro) ? filtro : undefined
        }
        autoOpenModal={autoOpen}
      />
    </div>
  );
}
