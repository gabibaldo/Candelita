import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  await prisma.bloqueoDia.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
