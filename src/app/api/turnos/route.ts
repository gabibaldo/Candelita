import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createMeetEvent } from "@/lib/google";
import { z } from "zod";

export const runtime = "nodejs";

const TurnoSchema = z.object({
  pacienteId: z.number().int().positive(),
  inicio: z.string(), // ISO
  fin: z.string().optional(),
  estado: z
    .enum(["programado", "realizado", "cancelado", "ausente"])
    .optional(),
  importe: z.union([z.number(), z.string(), z.null()]).optional(),
  cobrado: z.boolean().optional(),
  confirmado: z.boolean().optional(),
  modalidad: z.enum(["presencial", "virtual"]).optional(),
  notas: z.string().optional().nullable(),
  repetirSemanas: z.number().int().min(0).max(52).optional(),
});

function addMinutes(d: Date, min: number) {
  return new Date(d.getTime() + min * 60_000);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pacienteId = searchParams.get("pacienteId");

  const where: any = {};
  if (from || to) {
    where.inicio = {};
    if (from) where.inicio.gte = new Date(from);
    if (to) where.inicio.lte = new Date(to);
  }
  if (pacienteId) where.pacienteId = Number(pacienteId);

  const turnos = await prisma.turno.findMany({
    where,
    orderBy: { inicio: "asc" },
    include: {
      paciente: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          tipo: true,
          importeSesion: true,
          motivoConsulta: true,
          diagnostico: true,
          obraSocialNombre: true,
          tutorNombre: true,
          tutorTelefono: true,
          telefono: true,
        },
      },
      sesion: { select: { id: true } },
    },
  });

  return NextResponse.json(turnos);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = TurnoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const inicio = new Date(d.inicio);
  const fin = d.fin ? new Date(d.fin) : addMinutes(inicio, 45);

  const paciente = await prisma.paciente.findUnique({
    where: { id: d.pacienteId },
    select: { importeSesion: true },
  });
  if (!paciente) {
    return NextResponse.json({ error: "Paciente inexistente" }, { status: 400 });
  }

  const importeRaw = d.importe;
  let importe: number | null = null;
  if (importeRaw !== undefined && importeRaw !== null && importeRaw !== "") {
    const n = Number(importeRaw);
    importe = Number.isFinite(n) ? n : null;
  }

  const semanas = d.repetirSemanas ?? 0;
  const turnosData = Array.from({ length: semanas + 1 }, (_, i) => ({
    pacienteId: d.pacienteId,
    inicio: new Date(inicio.getTime() + i * 7 * 86_400_000),
    fin: new Date(fin.getTime() + i * 7 * 86_400_000),
    estado: d.estado ?? "programado",
    importe,
    cobrado: d.cobrado ?? false,
    confirmado: d.confirmado ?? false,
    modalidad: d.modalidad ?? "presencial",
    notas: d.notas ?? null,
  }));

  if (turnosData.length === 1) {
    const turno = await prisma.turno.create({
      data: turnosData[0],
      include: { paciente: true },
    });

    if (d.modalidad === "virtual") {
      const session = await getSession();
      if (session) {
        const usuario = await (prisma.usuario as any).findFirst({
          select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true },
        });
        if (usuario?.googleAccessToken && usuario?.googleRefreshToken) {
          try {
            const { googleEventId, meetLink } = await createMeetEvent(
              usuario.googleAccessToken,
              usuario.googleRefreshToken,
              usuario.googleTokenExpiry,
              {
                summary: `Sesión — ${(turno.paciente as any).nombre} ${(turno.paciente as any).apellido}`,
                start: turno.inicio,
                end: turno.fin,
              }
            );
            await prisma.turno.update({
              where: { id: turno.id },
              data: { googleEventId, meetLink },
            });
            return NextResponse.json({ ...turno, googleEventId, meetLink }, { status: 201 });
          } catch {
            // Si falla Google Calendar, el turno se guarda igual
          }
        }
      }
    }

    return NextResponse.json(turno, { status: 201 });
  }

  await prisma.turno.createMany({ data: turnosData });
  return NextResponse.json({ creados: turnosData.length }, { status: 201 });
}
