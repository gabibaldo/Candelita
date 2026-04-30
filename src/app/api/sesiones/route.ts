import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const SesionSchema = z.object({
  pacienteId: z.number().int().positive(),
  turnoId: z.number().int().positive().optional().nullable(),
  fecha: z.string(),
  tipo: z.enum(["sesion", "nota"]).optional().default("sesion"),
  resumen: z.string().min(1),
  objetivos: z.string().optional().nullable(),
  proximosPasos: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
      tipo: d.tipo ?? "sesion",
      resumen: d.resumen,
      objetivos: d.objetivos ?? null,
      proximosPasos: d.proximosPasos ?? null,
    },
  });

  return NextResponse.json(sesion, { status: 201 });
}
