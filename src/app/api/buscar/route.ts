import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ pacientes: [], sesiones: [] });

  const qNorm = stripAccents(q).toLowerCase();

  const [pacientes, sesiones] = await Promise.all([
    prisma.paciente.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        tipo: true,
        obraSocialNombre: true,
        diagnostico: true,
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
    prisma.sesion.findMany({
      where: { resumen: { contains: q, mode: "insensitive" } },
      select: {
        id: true,
        fecha: true,
        resumen: true,
        paciente: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
      take: 5,
    }),
  ]);

  const pacientesFiltrados = pacientes
    .filter((p) =>
      stripAccents(`${p.apellido} ${p.nombre}`).toLowerCase().includes(qNorm)
    )
    .slice(0, 6);

  return NextResponse.json({ pacientes: pacientesFiltrados, sesiones });
}
