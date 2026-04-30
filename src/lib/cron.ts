import cron from "node-cron";
import { prisma } from "./db";
import { enviarRecordatorio, type TurnoDelDia } from "./email";

export function startCron() {
  // Todos los días a las 22hs (hora Argentina, UTC-3 = 01:00 UTC del día siguiente)
  cron.schedule("0 1 * * *", async () => {
    try {
      const usuario = await prisma.usuario.findFirst({
        select: { email: true },
      });
      if (!usuario) return;

      // Mañana en hora Argentina
      const ahora = new Date();
      const manana = new Date(ahora);
      manana.setUTCDate(manana.getUTCDate() + 1);

      // Rango UTC que corresponde al día completo en Argentina (UTC-3)
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

      if (turnos.length === 0) return;

      await enviarRecordatorio(usuario.email, turnos as TurnoDelDia[], inicioManana);
    } catch (err) {
      console.error("[cron recordatorio]", err);
    }
  });

  console.log("[cron] Recordatorio de turnos programado a las 22hs Argentina");
}
