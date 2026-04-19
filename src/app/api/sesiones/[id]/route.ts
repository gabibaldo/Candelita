import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

const UpdateSchema = z
  .object({
    fecha: z.string().optional(),
    resumen: z.string().min(1).optional(),
    objetivos: z.string().optional().nullable(),
    proximosPasos: z.string().optional().nullable(),
  })
  .strict();

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data: any = { ...parsed.data };
  if ("fecha" in data) data.fecha = new Date(data.fecha);
  const sesion = await prisma.sesion.update({ where: { id }, data });
  return NextResponse.json(sesion);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  await prisma.sesion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
