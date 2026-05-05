import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarRecordatorio, type TurnoDelDia } from "@/lib/email";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Vercel Cron autentica con Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET ?? ""}`, "utf8");
  const actual = Buffer.from(auth, "utf8");
  const authorized = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usuario = await prisma.usuario.findFirst({ select: { email: true } });
  if (!usuario) return NextResponse.json({ ok: true });

  const ahora = new Date();

  const inicioManana = new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), 3, 0, 0)
  );
  const finManana = new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() + 1, 3, 0, 0)
  );

  const turnos = await prisma.turno.findMany({
    where: { inicio: { gte: inicioManana, lt: finManana }, estado: "programado" },
    orderBy: { inicio: "asc" },
    include: {
      paciente: {
        select: {
          nombre: true, apellido: true, diagnostico: true, motivoConsulta: true,
          tutorNombre: true, tutorTelefono: true, tutorEmail: true,
          recordatorioEmail: true, notasGenerales: true,
        },
      },
      sesion: { select: { resumen: true, fecha: true } },
    },
  });

  if (turnos.length > 0) {
    await enviarRecordatorio(usuario.email, turnos as TurnoDelDia[], inicioManana);
  }

  return NextResponse.json({ ok: true, enviados: turnos.length });
}
