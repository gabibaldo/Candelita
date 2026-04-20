import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// GET /api/archivos/[id] → redirige al blob URL (solo usuarios autenticados)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const archivo = await (prisma as any).archivo.findUnique({ where: { id } });
  if (!archivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.redirect(archivo.ruta);
}

// DELETE /api/archivos/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const archivo = await (prisma as any).archivo.findUnique({ where: { id } });
  if (!archivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await del(archivo.ruta).catch(() => {});
  await (prisma as any).archivo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
