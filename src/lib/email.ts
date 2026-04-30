import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type TurnoDelDia = {
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
    tutorEmail: string | null;
    recordatorioEmail: boolean;
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

// Mail de Cande: resumen de todos los turnos del día
function buildHtmlCande(turnos: TurnoDelDia[], fecha: Date): string {
  const fechaStr = formatFecha(fecha);
  const items = turnos
    .map((t) => {
      const hora = `${formatHora(t.inicio)} – ${formatHora(t.fin)}`;
      return `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px">
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1f2937">
            ${hora} · ${t.paciente.nombre} ${t.paciente.apellido}
          </p>
          ${t.paciente.diagnostico ? `<p style="margin:4px 0;color:#6b7280;font-size:13px"><strong>Diagnóstico:</strong> ${t.paciente.diagnostico}</p>` : ""}
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

// Mail al tutor: recordatorio de un turno específico
function buildHtmlTutor(turno: TurnoDelDia, fecha: Date): string {
  const fechaStr = formatFecha(fecha);
  const hora = `${formatHora(turno.inicio)} – ${formatHora(turno.fin)}`;
  const meetSection = turno.modalidad === "virtual" && turno.meetLink
    ? `<div style="margin-top:16px;padding:12px;background:#f5f3ff;border-radius:8px">
        <p style="margin:0;font-size:14px;color:#1f2937">La sesión es <strong>virtual</strong>. Ingresá desde este link:</p>
        <a href="${turno.meetLink}" style="display:inline-block;margin-top:8px;color:#6d28d9;font-weight:600">${turno.meetLink}</a>
       </div>`
    : turno.modalidad === "virtual"
    ? `<p style="color:#6b7280;font-size:13px">La sesión es virtual. El link de Meet será enviado próximamente.</p>`
    : "";

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h1 style="font-size:20px;margin-bottom:4px">Recordatorio de turno</h1>
      <p style="color:#6b7280;margin-bottom:20px">${fechaStr}</p>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px">
        <p style="margin:0 0 4px;font-size:16px;font-weight:600">${turno.paciente.nombre} ${turno.paciente.apellido}</p>
        <p style="margin:4px 0;color:#6b7280;font-size:14px">Horario: ${hora}</p>
        <p style="margin:4px 0;color:#6b7280;font-size:14px">Modalidad: ${turno.modalidad === "virtual" ? "Virtual" : "Presencial"}</p>
        ${meetSection}
      </div>
      <p style="margin-top:20px;font-size:12px;color:#9ca3af">Este es un recordatorio automático de Lic. Candela Berardi · Psicóloga Infantil.</p>
    </div>`;
}

export async function enviarRecordatorio(
  destinatarioCande: string,
  turnos: TurnoDelDia[],
  fecha: Date
) {
  if (turnos.length === 0) return;

  const fechaStr = formatFecha(fecha);

  // Mail a Cande con todos los turnos
  await resend.emails.send({
    from: `Candelita <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`,
    to: destinatarioCande,
    subject: `Recordatorio de Turnos - ${fechaStr}`,
    html: buildHtmlCande(turnos, fecha),
  });

  // Mails individuales a tutores que tienen recordatorioEmail activado
  const conRecordatorio = turnos.filter(
    (t) => t.paciente.recordatorioEmail && t.paciente.tutorEmail
  );

  await Promise.all(
    conRecordatorio.map((t) =>
      resend.emails.send({
        from: `Lic. Candela Berardi <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`,
        to: t.paciente.tutorEmail!,
        subject: `Recordatorio de turno - ${t.paciente.nombre} ${t.paciente.apellido}`,
        html: buildHtmlTutor(t, fecha),
      })
    )
  );
}
