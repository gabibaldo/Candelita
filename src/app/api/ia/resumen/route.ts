import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Sos una asistente clínica para una psicóloga infantil argentina (Lic. Candela Berardi).
Tu tarea es transformar notas breves de sesión en un resumen clínico estructurado, profesional y en primera persona del terapeuta.

El resumen debe incluir:
1. **Presentación del paciente**: cómo llegó a la sesión (estado afectivo, disposición).
2. **Contenido trabajado**: temas, juego simbólico, relatos o materiales usados.
3. **Intervenciones realizadas**: qué hizo la terapeuta, técnicas o señalamientos.
4. **Observaciones clínicas**: hipótesis, patrones, emergentes.
5. **Cierre de sesión**: cómo terminó, próximos pasos si los hay.

Usá lenguaje técnico pero accesible. Máximo 400 palabras. No inventes información — solo elaborá lo que está en las notas.`;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const notas = typeof body?.notas === "string" ? body.notas.trim() : null;

  if (!notas || notas.length < 5) {
    return NextResponse.json({ error: "Notas insuficientes para generar un resumen" }, { status: 400 });
  }
  if (notas.length > 10000) {
    return NextResponse.json({ error: "Texto demasiado largo" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
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
        content: `Estas son mis notas de la sesión:\n\n${notas}\n\nGenerá el resumen clínico estructurado.`,
      },
    ],
  });

  const texto = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return NextResponse.json({ resumen: texto });
}
