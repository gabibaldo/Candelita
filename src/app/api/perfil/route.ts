import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createSession } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const PerfilSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    email: z.string().email().optional(),
    telefono: z.string().optional().nullable(),
    titulo: z.string().optional().nullable(),
    matricula: z.string().optional().nullable(),
    especialidad: z.string().optional().nullable(),
    domicilioProfesional: z.string().optional().nullable(),
    cuit: z.string().optional().nullable(),
    razonSocial: z.string().optional().nullable(),
    condicionAfip: z.string().optional().nullable(),
    domicilioFiscal: z.string().optional().nullable(),
    cbu: z.string().optional().nullable(),
    aliasBank: z.string().optional().nullable(),
  })
  .strict();

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usuario = await (prisma.usuario as any).findUnique({
      where: { id: Number(session.sub) },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        titulo: true,
        matricula: true,
        especialidad: true,
        domicilioProfesional: true,
        cuit: true,
        razonSocial: true,
        condicionAfip: true,
        domicilioFiscal: true,
        cbu: true,
        aliasBank: true,
        googleAccessToken: true,
      },
    });

    if (!usuario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(usuario);
  } catch (err: any) {
    console.error("[GET /api/perfil]", err);
    return NextResponse.json(
      { error: "Error interno al cargar el perfil. ¿Corriste npx prisma db push?" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = PerfilSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Verificar email único si se está cambiando
    if (data.email && data.email !== session.email) {
      const exists = await prisma.usuario.findUnique({ where: { email: data.email } });
      if (exists) {
        return NextResponse.json({ error: "Ese email ya está en uso." }, { status: 409 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.usuario as any).update({
      where: { id: Number(session.sub) },
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        titulo: true,
        matricula: true,
        especialidad: true,
        domicilioProfesional: true,
        cuit: true,
        razonSocial: true,
        condicionAfip: true,
        domicilioFiscal: true,
        cbu: true,
        aliasBank: true,
      },
    });

    // Re-emitir JWT si cambió nombre o email
    if (data.nombre || data.email) {
      await createSession({
        sub: session.sub,
        email: updated.email,
        nombre: updated.nombre,
        loginAt: session.loginAt,
      });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PATCH /api/perfil]", err);
    return NextResponse.json(
      { error: "Error interno al guardar el perfil." },
      { status: 500 }
    );
  }
}
