import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  const inicio = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`);
  const fin = new Date(inicio);
  fin.setMonth(fin.getMonth() + 1);

  const turnos = await prisma.turno.findMany({
    where: {
      inicio: { gte: inicio, lt: fin },
      estado: { in: ["programado", "realizado"] },
    },
    orderBy: { inicio: "asc" },
    include: {
      paciente: { select: { nombre: true, apellido: true, tipo: true, obraSocialNombre: true, importeSesion: true } },
    },
  });

  const rows = [
    ["Fecha", "Hora", "Paciente", "Tipo", "Obra Social", "Importe", "Estado", "Cobrado"].join(","),
    ...turnos.map((t) => {
      const d = new Date(t.inicio);
      const fecha = d.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
      const hora = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" });
      const paciente = `${t.paciente.apellido}, ${t.paciente.nombre}`;
      const tipo = t.paciente.tipo === "obra_social" ? "Obra Social" : "Particular";
      const obraSocial = t.paciente.obraSocialNombre ?? "";
      const importe = (t.importe ?? t.paciente.importeSesion).toFixed(2);
      const cobrado = t.cobrado ? "Sí" : "No";
      return [fecha, hora, `"${paciente}"`, tipo, `"${obraSocial}"`, importe, t.estado, cobrado].join(",");
    }),
  ].join("\n");

  const filename = `cobros-${year}-${String(month).padStart(2, "0")}.csv`;
  return new NextResponse("﻿" + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
