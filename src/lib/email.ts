import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type TurnoDelDia = {
  inicio: Date;
  fin: Date;
  modalidad: string;
  meetLink: string | null;
  notas: string | null;
  paciente: {
    nombre: string;
    apellido: string;
    diagnostico: string | null;
    motivoConsulta: string | null;
    tutorNombre: string | null;
    tutorTelefono: string | null;
    telefono: string | null;
    notasGenerales: string | null;
  };
  sesion?: { resumen: string; fecha: Date } | null;
};

function formatHora(d: Date) {
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function formatFecha(d: Date) {
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function buildHtml(turnos: TurnoDelDia[], fecha: Date): string {
  const fechaStr = formatFecha(fecha);

  const items = turnos
    .map((t) => {
      const hora = `${formatHora(t.inicio)} – ${formatHora(t.fin)}`;
      const contacto =
        t.paciente.tutorNombre
          ? `${t.paciente.tutorNombre} · ${t.paciente.tutorTelefono ?? "sin tel."}`
          : t.paciente.telefono ?? "sin contacto";

      const meet = t.meetLink
        ? `<p style="margin:4px 0"><a href="${t.meetLink}" style="color:#6d28d9">Link Meet</a></p>`
        : "";

      const ultimaSesion = t.sesion
        ? `<p style="margin:4px 0;color:#6b7280;font-size:13px"><strong>Última sesión:</strong> ${t.sesion.resumen.slice(0, 200)}${t.sesion.resumen.length > 200 ? "…" : ""}</p>`
        : "";

      return `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px">
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1f2937">
            ${hora} · ${t.paciente.nombre} ${t.paciente.apellido}
          </p>
          <p style="margin:4px 0;color:#6b7280;font-size:13px">${t.modalidad === "virtual" ? "Virtual" : "Presencial"} · ${contacto}</p>
          ${t.paciente.diagnostico ? `<p style="margin:4px 0;color:#6b7280;font-size:13px"><strong>Diagnóstico:</strong> ${t.paciente.diagnostico}</p>` : ""}
          ${t.paciente.notasGenerales ? `<p style="margin:4px 0;color:#6b7280;font-size:13px"><strong>Notas:</strong> ${t.paciente.notasGenerales}</p>` : ""}
          ${meet}
          ${ultimaSesion}
        </div>`;
    })
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1 style="font-size:20px;margin-bottom:4px">Turnos del ${fechaStr}</h1>
      <p style="color:#6b7280;margin-bottom:20px">${turnos.length} turno${turnos.length !== 1 ? "s" : ""} programado${turnos.length !== 1 ? "s" : ""}</p>
      ${items}
    </div>`;
}

export async function enviarRecordatorio(
  destinatario: string,
  turnos: TurnoDelDia[],
  fecha: Date
) {
  if (turnos.length === 0) return;

  const fechaStr = formatFecha(fecha);

  await resend.emails.send({
    from: "Candelita <onboarding@resend.dev>",
    to: destinatario,
    subject: `Turnos de mañana · ${fechaStr}`,
    html: buildHtml(turnos, fecha),
  });
}
