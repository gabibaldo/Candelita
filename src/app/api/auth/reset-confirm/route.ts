import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { auditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { token, email, password } = body ?? {};

  if (!token || !email || !password || typeof password !== "string") {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const minDelay = new Promise<void>((r) => setTimeout(r, 700 + Math.random() * 300));

  const usuario = await prisma.usuario.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, resetToken: true, resetTokenExpiry: true },
  });

  if (!usuario || !usuario.resetToken || !usuario.resetTokenExpiry) {
    await minDelay;
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
  }

  if (new Date(usuario.resetTokenExpiry) < new Date()) {
    await minDelay;
    return NextResponse.json({ error: "El link ya expiró. Solicitá uno nuevo." }, { status: 400 });
  }

  const valid = await bcrypt.compare(token, usuario.resetToken);
  if (!valid) {
    await minDelay;
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
  }

  // Actualizar contraseña y limpiar token
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  await auditLog({ usuarioId: usuario.id, action: "pwd_reset" });
  return NextResponse.json({ ok: true });
}
