import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pacienteId = searchParams.get("pacienteId");
  if (!pacienteId || isNaN(Number(pacienteId))) {
    return NextResponse.json({ error: "pacienteId requerido" }, { status: 400 });
  }
  const archivos = await (prisma as any).archivo.findMany({
    where: { pacienteId: Number(pacienteId) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(archivos);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const pacienteIdStr = formData.get("pacienteId") as string | null;
  if (!file || !pacienteIdStr || isNaN(Number(pacienteIdStr))) {
    return NextResponse.json({ error: "Falta archivo o pacienteId" }, { status: 400 });
  }

  const pacienteId = Number(pacienteIdStr);

  const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true } });
  if (!paciente) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo no puede superar 10 MB" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 100);
  const blobPath = `archivos/${pacienteId}/${Date.now()}-${safeName}`;

  const blob = await put(blobPath, file, { access: "public" });

  const archivo = await (prisma as any).archivo.create({
    data: {
      pacienteId,
      nombre: file.name,
      ruta: blob.url,
      tipo: file.type || "application/octet-stream",
      tamano: file.size,
    },
  });

  return NextResponse.json(archivo, { status: 201 });
}
