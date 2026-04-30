import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const UpdateSchema = z
  .object({
    pacienteId: z.number().int().positive().optional(),
    inicio: z.string().optional(),
    fin: z.string().optional(),
    estado: z.enum(["programado", "realizado", "cancelado", "ausente"]).optional(),
    importe: z.union([z.number(), z.string(), z.null()]).optional(),
    cobrado: z.boolean().optional(),
    confirmado: z.boolean().optional(),
    modalidad: z.enum(["presencial", "virtual"]).optional(),
    notas: z.string().max(5000).optional().nullable(),
  })
  .strict();

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 && Number.isInteger(n) ? n : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const turno = await prisma.turno.findUnique({
    where: { id },
    include: { paciente: true, sesion: true },
  });
  if (!turno) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (turno.paciente.usuarioId !== Number(s.sub)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  return NextResponse.json(turno);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const existing = await prisma.turno.findUnique({ where: { id }, include: { paciente: { select: { usuarioId: true } } } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (existing.paciente.usuarioId !== Number(s.sub)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data: any = { ...parsed.data };
  if ("inicio" in data) data.inicio = new Date(data.inicio);
  if ("fin" in data) data.fin = new Date(data.fin);
  if ("importe" in data) {
    if (data.importe === "" || data.importe == null) data.importe = null;
    else {
      const n = Number(data.importe);
      data.importe = Number.isFinite(n) ? n : null;
    }
  }

  const turno = await prisma.turno.update({
    where: { id },
    data,
    include: { paciente: true },
  });
  return NextResponse.json(turno);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const existing = await prisma.turno.findUnique({ where: { id }, include: { paciente: { select: { usuarioId: true } } } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (existing.paciente.usuarioId !== Number(s.sub)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await prisma.turno.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
