import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarRecordatorio } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Vercel Cron autentica con Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usuario = await (prisma.usuario as any).findFirst({ select: { email: true } });
  if (!usuario) return NextResponse.json({ ok: true });

  const ahora = new Date();
  const manana = new Date(ahora);
  manana.setUTCDate(manana.getUTCDate() + 1);

  const inicioManana = new Date(
    Date.UTC(manana.getUTCFullYear(), manana.getUTCMonth(), manana.getUTCDate(), 3, 0, 0)
  );
  const finManana = new Date(
    Date.UTC(manana.getUTCFullYear(), manana.getUTCMonth(), manana.getUTCDate() + 1, 3, 0, 0)
  );

  const turnos = await prisma.turno.findMany({
    where: { inicio: { gte: inicioManana, lt: finManana }, estado: "programado" },
    orderBy: { inicio: "asc" },
    include: {
      paciente: {
        select: {
          nombre: true, apellido: true, diagnostico: true, motivoConsulta: true,
          tutorNombre: true, tutorTelefono: true, telefono: true, notasGenerales: true,
        },
      },
      sesion: { select: { resumen: true, fecha: true } },
    },
  });

  if (turnos.length > 0) {
    await enviarRecordatorio(usuario.email, turnos as any, inicioManana);
  }

  return NextResponse.json({ ok: true, enviados: turnos.length });
}
