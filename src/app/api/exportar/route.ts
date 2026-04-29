import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const [pacientes, turnos, sesiones] = await Promise.all([
    prisma.paciente.findMany({ orderBy: { apellido: "asc" } }),
    prisma.turno.findMany({ orderBy: { inicio: "asc" } }),
    prisma.sesion.findMany({ orderBy: { fecha: "asc" } }),
  ]);

  const data = {
    exportadoEn: new Date().toISOString(),
    pacientes,
    turnos,
    sesiones,
  };

  const filename = `candelita-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
