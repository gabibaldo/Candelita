import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit, getIp } from "@/lib/ratelimit";
import { auditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!rateLimit(`export:${getIp(req)}`, 3, 24 * 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Límite de exportaciones alcanzado. Intentá mañana." },
      { status: 429 }
    );
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : null;
  if (!password) return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(session.sub) },
    select: { passwordHash: true },
  });
  if (!usuario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const ok = await bcrypt.compare(password, usuario.passwordHash);
  if (!ok) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 403 });

  const [pacientes, turnos, sesiones] = await Promise.all([
    prisma.paciente.findMany({ orderBy: { apellido: "asc" } }),
    prisma.turno.findMany({ orderBy: { inicio: "asc" } }),
    prisma.sesion.findMany({ orderBy: { fecha: "asc" } }),
  ]);

  const data = { exportadoEn: new Date().toISOString(), pacientes, turnos, sesiones };
  const filename = `candelita-backup-${new Date().toISOString().slice(0, 10)}.json`;

  await auditLog({ usuarioId: Number(session.sub), action: "export", ipAddress: getIp(req) });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
