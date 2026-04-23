import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

const UpdateSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    apellido: z.string().min(1).optional(),
    fechaNacimiento: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    celular: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal("")),
    direccion: z.string().optional().nullable(),
    tutorNombre: z.string().optional().nullable(),
    tutorTelefono: z.string().optional().nullable(),
    tutorDni: z.string().optional().nullable(),
    tutorRelacion: z.string().optional().nullable(),
    tipo: z.enum(["particular", "obra_social"]).optional(),
    obraSocialNombre: z.string().optional().nullable(),
    numeroAfiliado: z.string().optional().nullable(),
    sesionesAutorizadas: z.union([z.number(), z.string()]).optional().nullable(),
    importeSesion: z.union([z.number(), z.string()]).optional().nullable(),
    motivoConsulta: z.string().optional().nullable(),
    diagnostico: z.string().optional().nullable(),
    objetivosTerapeuticos: z.string().optional().nullable(),
    notasGenerales: z.string().optional().nullable(),
    activo: z.boolean().optional(),
  })
  .strict();

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      sesiones: { orderBy: { fecha: "desc" } },
      turnos: { orderBy: { inicio: "desc" }, take: 50 },
    },
  });
  if (!paciente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(paciente);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data: any = { ...parsed.data };
  if ("fechaNacimiento" in data) {
    data.fechaNacimiento = data.fechaNacimiento ? new Date(data.fechaNacimiento) : null;
  }
  if ("email" in data) data.email = data.email || null;
  if ("importeSesion" in data) {
    const n = Number(data.importeSesion);
    data.importeSesion = Number.isFinite(n) ? n : 0;
  }
  if ("sesionesAutorizadas" in data) {
    if (data.sesionesAutorizadas === "" || data.sesionesAutorizadas == null) {
      data.sesionesAutorizadas = null;
    } else {
      const n = Number(data.sesionesAutorizadas);
      data.sesionesAutorizadas = Number.isFinite(n) ? n : null;
    }
  }

  const paciente = await prisma.paciente.update({ where: { id }, data });
  return NextResponse.json(paciente);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  // Soft delete: marcamos inactivo para no perder la historia clínica.
  const paciente = await prisma.paciente.update({
    where: { id },
    data: { activo: false },
  });
  return NextResponse.json(paciente);
}
