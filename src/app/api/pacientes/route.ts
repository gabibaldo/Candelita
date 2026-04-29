import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

const PacienteSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  fechaNacimiento: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  celular: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  direccion: z.string().optional().nullable(),
  tutorNombre: z.string().optional().nullable(),
  tutorTelefono: z.string().optional().nullable(),
  tutorCelular: z.string().optional().nullable(),
  tutorEmail: z.string().email().optional().nullable().or(z.literal("")),
  tutorDni: z.string().optional().nullable(),
  tutorRelacion: z.string().optional().nullable(),
  recordatorioEmail: z.boolean().optional(),
  tipo: z.enum(["particular", "obra_social"]),
  obraSocialNombre: z.string().optional().nullable(),
  numeroAfiliado: z.string().optional().nullable(),
  sesionesAutorizadas: z
    .union([z.number(), z.string()])
    .optional()
    .nullable(),
  importeSesion: z.union([z.number(), z.string()]).optional().nullable(),
  motivoConsulta: z.string().optional().nullable(),
  derivaciones: z.string().optional().nullable(),
  diagnostico: z.string().optional().nullable(),
  objetivosTerapeuticos: z.string().optional().nullable(),
  notasGenerales: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

function normalize(data: z.infer<typeof PacienteSchema>) {
  const parseNumber = (v: unknown): number | null => {
    if (v === "" || v == null) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    ...data,
    email: data.email || null,
    fechaNacimiento: data.fechaNacimiento
      ? new Date(data.fechaNacimiento)
      : null,
    importeSesion: parseNumber(data.importeSesion) ?? 0,
    sesionesAutorizadas: parseNumber(data.sesionesAutorizadas),
  };
}

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const activo = searchParams.get("activo");

  const where: Prisma.PacienteWhereInput = {};
  if (activo === "true") where.activo = true;
  if (activo === "false") where.activo = false;

  const all = await prisma.paciente.findMany({
    where,
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    include: {
      _count: { select: { turnos: true, sesiones: true } },
      turnos: { orderBy: { inicio: "desc" }, take: 1, select: { inicio: true } },
    },
  });

  const toJson = (list: typeof all) =>
    list.map(({ turnos, ...p }) => ({
      ...p,
      ultimoTurno: turnos[0]?.inicio?.toISOString() ?? null,
    }));

  if (!q) return NextResponse.json(toJson(all));

  const qn = stripAccents(q);
  const filtered = all.filter(
    (p) =>
      stripAccents(p.nombre).includes(qn) ||
      stripAccents(p.apellido).includes(qn) ||
      (p.tutorNombre && stripAccents(p.tutorNombre).includes(qn))
  );

  return NextResponse.json(toJson(filtered));
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PacienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = normalize(parsed.data);
  const paciente = await prisma.paciente.create({ data });
  return NextResponse.json(paciente, { status: 201 });
}
