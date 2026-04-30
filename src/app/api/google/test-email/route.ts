import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enviarRecordatorio, type TurnoDelDia } from "@/lib/email";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const usuario = await prisma.usuario.findFirst({
    select: { email: true },
  });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

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
    where: {
      inicio: { gte: inicioManana, lt: finManana },
      estado: "programado",
    },
    orderBy: { inicio: "asc" },
    include: {
      paciente: {
        select: {
          nombre: true,
          apellido: true,
          diagnostico: true,
          motivoConsulta: true,
          tutorNombre: true,
          tutorTelefono: true,
          tutorEmail: true,
          recordatorioEmail: true,
          notasGenerales: true,
        },
      },
      sesion: {
        select: { resumen: true, fecha: true },
      },
    },
  });

  if (turnos.length === 0) {
    return NextResponse.json({ ok: false, mensaje: "No hay turnos programados para mañana" });
  }

  await enviarRecordatorio(usuario.email, turnos as TurnoDelDia[], inicioManana);
  return NextResponse.json({ ok: true, enviado_a: usuario.email, turnos: turnos.length });
}
