import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { rateLimit, getIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  if (!rateLimit(`reset:${getIp(req)}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intentá de nuevo en 1 hora." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  // Buscar usuario (siempre responder OK para no filtrar si el email existe)
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (usuario) {
    // Generar token aleatorio
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.usuario.update({
      where: { email },
      data: { resetToken: tokenHash, resetTokenExpiry: expiry },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password#token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
      await resend.emails.send({
        from: `Candelita <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`,
        to: email,
        subject: "Recuperar contraseña · Lic. Candela Berardi",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
            <div style="background:linear-gradient(135deg,#7c3aed,#4f1f9e);border-radius:12px;padding:32px;text-align:center;margin-bottom:24px">
              <h1 style="color:white;margin:0;font-size:20px">Lic. Candela Berardi</h1>
              <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Psicóloga Infantil · Gestión de Turnos</p>
            </div>
            <h2 style="font-size:18px;margin-bottom:8px">Recuperar contraseña</h2>
            <p style="color:#6b7280;margin-bottom:24px">
              Recibiste este correo porque solicitaste restablecer tu contraseña.
              Hacé clic en el botón para crear una nueva:
            </p>
            <a href="${resetUrl}"
               style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">
              Restablecer contraseña
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">
              Este link expira en 1 hora. Si no solicitaste este cambio, podés ignorar este correo.
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#9ca3af;font-size:11px">
              Si el botón no funciona, copiá este link en tu navegador:<br>
              <span style="color:#7c3aed">${resetUrl}</span>
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      // El email falló pero el token ya está guardado — loguear sin romper el flujo
      console.error("[reset-request] Error enviando email:", emailErr);
      console.log("[reset-request] Fallback: token generado para", email);
    }
  }

  // Siempre devolver éxito (no filtrar si el usuario existe)
  return NextResponse.json({ ok: true });
}
