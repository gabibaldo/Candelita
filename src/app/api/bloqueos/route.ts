import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const bloqueos = await prisma.bloqueoDia.findMany({ orderBy: { inicio: "asc" } });
  return NextResponse.json(bloqueos);
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { inicio, fin, motivo } = await req.json();
  if (!inicio || !fin) return NextResponse.json({ error: "inicio y fin son requeridos" }, { status: 400 });
  if (new Date(fin) <= new Date(inicio)) return NextResponse.json({ error: "fin debe ser posterior a inicio" }, { status: 400 });
  const bloqueo = await prisma.bloqueoDia.create({
    data: { inicio: new Date(inicio), fin: new Date(fin), motivo: motivo || null },
  });
  return NextResponse.json(bloqueo, { status: 201 });
}
