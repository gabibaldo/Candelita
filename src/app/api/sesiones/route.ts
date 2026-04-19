import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

const SesionSchema = z.object({
  pacienteId: z.number().int().positive(),
  turnoId: z.number().int().positive().optional().nullable(),
  fecha: z.string(),
  resumen: z.string().min(1),
  objetivos: z.string().optional().nullable(),
  proximosPasos: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pacienteId = searchParams.get("pacienteId");
  const where: any = {};
  if (pacienteId) where.pacienteId = Number(pacienteId);
  const sesiones = await prisma.sesion.findMany({
    where,
    orderBy: { fecha: "desc" },
    include: { paciente: { select: { nombre: true, apellido: true } } },
  });
  return NextResponse.json(sesiones);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = SesionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const sesion = await prisma.sesion.create({
    data: {
      pacienteId: d.pacienteId,
      turnoId: d.turnoId ?? null,
      fecha: new Date(d.fecha),
      resumen: d.resumen,
      objetivos: d.objetivos ?? null,
      proximosPasos: d.proximosPasos ?? null,
    },
  });

  // Si la sesión se vincula a un turno, marcar el turno como realizado.
  if (d.turnoId) {
    await prisma.turno.update({
      where: { id: d.turnoId },
      data: { estado: "realizado" },
    });
  }

  return NextResponse.json(sesion, { status: 201 });
}
