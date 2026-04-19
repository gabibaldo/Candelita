import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  const map: Record<string, string> = {
    "\u2018": "'", "\u2019": "'", "\u201C": '"', "\u201D": '"',
    "\u2013": "-", "\u2014": "-", "\u2026": "...", "\u2022": "*",
    "\u00A0": " ", "\u200B": "", "\u00B0": ".",
  };
  let out = input;
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  return out.split("").map((c) => (c.charCodeAt(0) > 0xff ? "?" : c)).join("");
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function fmtHora(d: Date) {
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function fmtMoney(n: number) {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const [turno, usuario] = await Promise.all([
    prisma.turno.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            nombre: true, apellido: true, tipo: true,
            obraSocialNombre: true, numeroAfiliado: true,
            tutorNombre: true, importeSesion: true,
          },
        },
      },
    }),
    (prisma.usuario as any).findFirst({
      select: {
        nombre: true, titulo: true, matricula: true, especialidad: true,
        cuit: true, domicilioProfesional: true, cbu: true, aliasBank: true,
      },
    }),
  ]);

  if (!turno) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const importe = turno.importe ?? turno.paciente.importeSesion;

  const pdf = await PDFDocument.create();
  const font  = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const BRAND   = rgb(0.37, 0.15, 0.24);   // header oscuro
  const BRAND2  = rgb(0.55, 0.25, 0.38);   // acento medio
  const BRAND_L = rgb(0.96, 0.91, 0.94);   // fondo tabla header
  const DARK    = rgb(0.15, 0.13, 0.12);
  const MID     = rgb(0.45, 0.40, 0.36);
  const LIGHT   = rgb(0.88, 0.84, 0.82);
  const WHITE   = rgb(1, 1, 1);
  const GREEN   = rgb(0.13, 0.49, 0.29);
  const AMBER   = rgb(0.76, 0.44, 0.04);

  // A5 horizontal (148×210mm → 419×595pt aprox) — usamos tamaño carta
  const W = 612;
  const H = 432;
  const mX = 44;
  const page = pdf.addPage([W, H]);

  // ── Banda superior ──────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: H - 70, width: W, height: 70, color: BRAND });
  // Línea acento inferior de la banda
  page.drawRectangle({ x: 0, y: H - 73, width: W, height: 3, color: BRAND2 });

  const nombreProfesional = sanitize(
    [usuario?.titulo, usuario?.nombre].filter(Boolean).join(" ") || "Lic. Candela Berardi"
  );
  const especialidad = sanitize(usuario?.especialidad || "Psicologa Infantil");

  // Izquierda — nombre profesional
  page.drawText(nombreProfesional, { x: mX, y: H - 30, size: 15, font: fontB, color: WHITE });
  page.drawText(especialidad,       { x: mX, y: H - 48, size: 9.5, font, color: rgb(0.85, 0.72, 0.78) });

  // Derecha — número de recibo
  const nroLabel = `Recibo Nro. ${String(turno.id).padStart(5, "0")}`;
  const nroW = fontB.widthOfTextAtSize(nroLabel, 12);
  page.drawText(nroLabel, { x: W - mX - nroW, y: H - 30, size: 12, font: fontB, color: WHITE });
  const fechaLabel = `Fecha: ${fmtDate(new Date())}`;
  const fechaW = font.widthOfTextAtSize(fechaLabel, 9);
  page.drawText(fechaLabel, { x: W - mX - fechaW, y: H - 48, size: 9, font, color: rgb(0.85, 0.72, 0.78) });

  // ── Bloque de datos: profesional izq | paciente der ────────────
  const bodyTop = H - 95;
  const col1 = mX;
  const col2 = W / 2 + 20;
  const colW = W / 2 - mX - 20;

  // Separador vertical entre columnas
  page.drawLine({
    start: { x: W / 2 + 4, y: bodyTop + 4 },
    end:   { x: W / 2 + 4, y: bodyTop - 72 },
    thickness: 0.6, color: LIGHT,
  });

  // --- Columna izquierda: datos de la profesional ---
  page.drawText("PROFESIONAL", { x: col1, y: bodyTop, size: 7.5, font: fontB, color: BRAND2 });

  let yL = bodyTop - 14;
  function rowL(label: string, value: string) {
    if (!value) return;
    page.drawText(sanitize(label), { x: col1, y: yL, size: 8, font: fontB, color: MID });
    const lw = fontB.widthOfTextAtSize(sanitize(label), 8);
    // truncate value to fit column
    let val = sanitize(value);
    while (val.length > 1 && font.widthOfTextAtSize(val, 8.5) > colW - lw - 4) {
      val = val.slice(0, -1);
    }
    page.drawText(val, { x: col1 + lw + 4, y: yL, size: 8.5, font, color: DARK });
    yL -= 13;
  }

  rowL("Matricula:", usuario?.matricula ?? "");
  rowL("CUIT:", usuario?.cuit ?? "");
  rowL("Domicilio:", usuario?.domicilioProfesional ?? "");
  if (usuario?.cbu)       rowL("CBU:", usuario.cbu);
  if (usuario?.aliasBank) rowL("Alias:", usuario.aliasBank);

  // --- Columna derecha: datos del paciente ---
  page.drawText("PACIENTE", { x: col2, y: bodyTop, size: 7.5, font: fontB, color: BRAND2 });

  const pacNombre = sanitize(`${turno.paciente.apellido}, ${turno.paciente.nombre}`);
  page.drawText(pacNombre, { x: col2, y: bodyTop - 16, size: 12, font: fontB, color: BRAND });

  const tipoStr = turno.paciente.tipo === "obra_social"
    ? sanitize(`Obra social: ${turno.paciente.obraSocialNombre ?? "-"}`)
    : "Particular";
  page.drawText(tipoStr, { x: col2, y: bodyTop - 31, size: 8.5, font, color: MID });

  if (turno.paciente.tutorNombre) {
    const resp = sanitize(`Responsable: ${turno.paciente.tutorNombre}`);
    page.drawText(resp, { x: col2, y: bodyTop - 44, size: 8.5, font, color: MID });
  }

  // ── Línea separadora ────────────────────────────────────────────
  const tableTop = bodyTop - 88;
  page.drawLine({ start: { x: mX, y: tableTop + 14 }, end: { x: W - mX, y: tableTop + 14 }, thickness: 0.5, color: LIGHT });

  // ── Tabla ───────────────────────────────────────────────────────
  const cFecha   = mX + 260;
  const cHorario = mX + 360;
  const cImporte = W - mX;

  // Header tabla
  page.drawRectangle({ x: mX, y: tableTop - 6, width: W - mX * 2, height: 20, color: BRAND_L });
  page.drawText("Concepto",  { x: mX + 8,           y: tableTop + 1,  size: 8.5, font: fontB, color: BRAND });
  page.drawText("Fecha",     { x: cFecha,            y: tableTop + 1,  size: 8.5, font: fontB, color: BRAND });
  page.drawText("Horario",   { x: cHorario,          y: tableTop + 1,  size: 8.5, font: fontB, color: BRAND });
  const impH = "Importe";
  page.drawText(impH, { x: cImporte - fontB.widthOfTextAtSize(impH, 8.5), y: tableTop + 1, size: 8.5, font: fontB, color: BRAND });

  // Fila de datos
  const rowY = tableTop - 20;
  const concepto = sanitize(`Sesion de ${especialidad}`);
  const fechaSesion = fmtDate(new Date(turno.inicio));
  const horario = `${fmtHora(new Date(turno.inicio))} - ${fmtHora(new Date(turno.fin))}`;
  const importeStr = fmtMoney(importe);

  page.drawText(concepto,    { x: mX + 8,   y: rowY, size: 9.5, font,  color: DARK });
  page.drawText(fechaSesion, { x: cFecha,   y: rowY, size: 9.5, font,  color: DARK });
  page.drawText(horario,     { x: cHorario, y: rowY, size: 9.5, font,  color: DARK });
  const iW = fontB.widthOfTextAtSize(importeStr, 11);
  page.drawText(importeStr,  { x: cImporte - iW, y: rowY, size: 11, font: fontB, color: BRAND });

  // Línea bajo la fila
  const sepY = rowY - 14;
  page.drawLine({ start: { x: mX, y: sepY }, end: { x: W - mX, y: sepY }, thickness: 0.4, color: LIGHT });

  // Total
  const totalY = sepY - 18;
  page.drawText("TOTAL",      { x: cImporte - iW - 60, y: totalY, size: 8.5, font: fontB, color: MID });
  page.drawText(importeStr,   { x: cImporte - iW,      y: totalY, size: 13,  font: fontB, color: BRAND });

  // ── Footer ──────────────────────────────────────────────────────
  const footerY = 32;
  page.drawLine({ start: { x: mX, y: footerY + 14 }, end: { x: W - mX, y: footerY + 14 }, thickness: 0.4, color: LIGHT });

  page.drawText(sanitize(`${nombreProfesional}  -  ${especialidad}`), {
    x: mX, y: footerY, size: 7.5, font, color: MID,
  });

  // Badge estado
  const cobrado = turno.cobrado;
  const badgeLabel = cobrado ? "COBRADO" : "PENDIENTE DE COBRO";
  const badgeColor = cobrado ? GREEN : AMBER;
  const bW = fontB.widthOfTextAtSize(badgeLabel, 8) + 16;
  const bX = W - mX - bW;
  page.drawRectangle({ x: bX, y: footerY - 3, width: bW, height: 16, color: badgeColor });
  page.drawText(badgeLabel, { x: bX + 8, y: footerY + 2, size: 8, font: fontB, color: WHITE });

  const bytes = await pdf.save();
  const safeName = `recibo_${String(turno.id).padStart(5, "0")}_${sanitize(turno.paciente.apellido).toLowerCase()}`;

  return new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}.pdf"`,
    },
  });
}
