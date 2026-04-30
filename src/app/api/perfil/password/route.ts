import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

export const runtime = "nodejs";

const Schema = z.object({
  actual: z.string().min(1),
  nueva: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(session.sub) },
    select: { passwordHash: true },
  });
  if (!usuario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const ok = await bcrypt.compare(parsed.data.actual, usuario.passwordHash);
  if (!ok) return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });

  const nuevoHash = await bcrypt.hash(parsed.data.nueva, 10);
  await prisma.usuario.update({
    where: { id: Number(session.sub) },
    data: { passwordHash: nuevoHash },
  });

  await auditLog({ usuarioId: Number(session.sub), action: "pwd_change" });
  return NextResponse.json({ ok: true });
}
