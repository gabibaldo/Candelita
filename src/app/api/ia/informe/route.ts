import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Sos una asistente clínica para una psicóloga infantil argentina (Lic. Candela Berardi).
Tu tarea es redactar un informe de evolución terapéutica profesional a partir de los datos del paciente y el historial de sesiones.

El informe debe incluir:
1. **Datos del paciente**: nombre, edad, motivo de consulta.
2. **Diagnóstico y objetivos terapéuticos**: según lo registrado.
3. **Evolución del tratamiento**: síntesis de los avances, cambios observados, patrones a lo largo de las sesiones.
4. **Estado actual**: descripción del momento terapéutico presente.
5. **Recomendaciones y próximos pasos**: objetivos para continuar o derivaciones si corresponde.

Usá lenguaje técnico-profesional apropiado para un informe psicológico formal. Máximo 600 palabras. Solo usá la información proporcionada.`;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const pacienteId = typeof body?.pacienteId === "number" ? body.pacienteId : null;

  if (!pacienteId) {
    return NextResponse.json({ error: "pacienteId requerido" }, { status: 400 });
  }

  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    include: {
      sesiones: {
        orderBy: { fecha: "desc" },
        take: 20,
      },
    },
  });

  if (!paciente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (paciente.usuarioId !== Number(session.sub)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (paciente.sesiones.length === 0) {
    return NextResponse.json({ error: "El paciente no tiene sesiones registradas" }, { status: 400 });
  }

  const edad = paciente.fechaNacimiento
    ? Math.floor((Date.now() - new Date(paciente.fechaNacimiento).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const sesionesTexto = paciente.sesiones
    .map((s, i) => {
      const fecha = new Date(s.fecha).toLocaleDateString("es-AR");
      return `Sesión ${i + 1} (${fecha}):\n${s.resumen}${s.objetivos ? `\nObjetivos: ${s.objetivos}` : ""}${s.proximosPasos ? `\nPróximos pasos: ${s.proximosPasos}` : ""}`;
    })
    .join("\n\n---\n\n");

  const contexto = `
PACIENTE: ${paciente.nombre} ${paciente.apellido}${edad !== null ? `, ${edad} años` : ""}
MOTIVO DE CONSULTA: ${paciente.motivoConsulta ?? "No registrado"}
DIAGNÓSTICO: ${paciente.diagnostico ?? "No registrado"}
OBJETIVOS TERAPÉUTICOS: ${paciente.objetivosTerapeuticos ?? "No registrado"}
DERIVACIONES: ${paciente.derivaciones ?? "Ninguna"}
NOTAS GENERALES: ${paciente.notasGenerales ?? "Ninguna"}

ÚLTIMAS ${paciente.sesiones.length} SESIONES (más reciente primero):

${sesionesTexto}
`.trim();

  const message = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Generá el informe de evolución terapéutica con la siguiente información:\n\n${contexto}`,
      },
    ],
  });

  const texto = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return NextResponse.json({ informe: texto });
}
