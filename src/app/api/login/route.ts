import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/ratelimit";
import { auditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!rateLimit(`login:${getIp(req)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intentá de nuevo en 15 minutos." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email: string | undefined = body?.email;
  const password: string | undefined = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  const user = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await auditLog({ usuarioId: user.id, action: "login_fail", ipAddress: getIp(req) });
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  await auditLog({ usuarioId: user.id, action: "login_ok", ipAddress: getIp(req) });
  await createSession({
    sub: String(user.id),
    email: user.email,
    nombre: user.nombre,
    loginAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
