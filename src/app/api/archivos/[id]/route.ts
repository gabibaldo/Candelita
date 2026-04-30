import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

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

  const archivo = await prisma.archivo.findUnique({
    where: { id },
    include: { paciente: { select: { usuarioId: true } } },
  });
  if (!archivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (archivo.paciente.usuarioId !== Number(session.sub)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

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

  const archivo = await prisma.archivo.findUnique({
    where: { id },
    include: { paciente: { select: { usuarioId: true } } },
  });
  if (!archivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (archivo.paciente.usuarioId !== Number(session.sub)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await del(archivo.ruta).catch(() => {});
  await prisma.archivo.delete({ where: { id } });

  await auditLog({ usuarioId: Number(session.sub), action: "file_delete", resourceType: "archivo", resourceId: id });
  return NextResponse.json({ ok: true });
}
