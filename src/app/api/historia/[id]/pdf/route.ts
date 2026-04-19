import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

// Helvetica (StandardFont) usa encoding WinAnsi/Latin-1. Reemplazamos
// caracteres frecuentes fuera de ese set para evitar errores al dibujar
// sesiones que contengan comillas curvas, em-dash, ellipsis, etc.
function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  const replacements: Record<string, string> = {
    "\u2018": "'",
    "\u2019": "'",
    "\u201C": '"',
    "\u201D": '"',
    "\u2013": "-",
    "\u2014": "-",
    "\u2026": "...",
    "\u2022": "*",
    "\u00A0": " ",
    "\u200B": "",
    "\u2192": "->",
    "\u2190": "<-",
  };
  let out = input;
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(k).join(v);
  }
  // Cualquier char fuera de Latin-1 (>0xFF) lo sustituimos por "?" para no
  // romper la generación del PDF.
  return out
    .split("")
    .map((c) => (c.charCodeAt(0) > 0xff ? "?" : c))
    .join("");
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDateTime(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id == null)
    return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: { sesiones: { orderBy: { fecha: "asc" } } },
  });
  if (!paciente)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Paleta de colores
  const BRAND = rgb(0.44, 0.2, 0.3); // brand-700
  const BRAND_LIGHT = rgb(0.95, 0.9, 0.92); // brand-50
  const DARK = rgb(0.18, 0.16, 0.14); // ink-800
  const MID = rgb(0.47, 0.42, 0.37); // ink-500
  const LIGHT = rgb(0.89, 0.86, 0.83); // ink-200
  const WHITE = rgb(1, 1, 1);
  const SAGE = rgb(0.24, 0.34, 0.25); // sage-700

  const marginX = 50;
  const marginBottom = 55;
  let pageNum = 0;
  let page = pdf.addPage();
  let { width, height } = page.getSize();
  let y = height - marginBottom;

  // ─── helpers ─────────────────────────────────────────────────────────────

  function addPage() {
    // footer en la página anterior
    drawFooter();
    page = pdf.addPage();
    ({ width, height } = page.getSize());
    y = height - marginBottom;
    pageNum++;
    drawPageHeader();
  }

  function ensureSpace(needed: number) {
    if (y < marginBottom + needed) addPage();
  }

  const drawText = (
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      gap?: number;
      x?: number;
    } = {}
  ) => {
    const size = opts.size ?? 10.5;
    const usedFont = opts.bold ? fontB : font;
    const color = opts.color ?? DARK;
    const indent = opts.indent ?? 0;
    const startX = opts.x ?? marginX + indent;
    const maxWidth = width - marginX - startX;

    const safeText = sanitize(text ?? "");
    const lines: string[] = [];
    safeText.split(/\r?\n/).forEach((paragraph) => {
      if (!paragraph.trim()) { lines.push(""); return; }
      const words = paragraph.split(/\s+/);
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (usedFont.widthOfTextAtSize(test, size) > maxWidth && line) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
    });

    for (const l of lines) {
      ensureSpace(size + 6);
      page.drawText(l || " ", {
        x: startX,
        y,
        size,
        font: usedFont,
        color,
      });
      y -= size + 4;
    }
    y -= opts.gap ?? 0;
  };

  function drawSectionHeader(title: string) {
    ensureSpace(28);
    page.drawRectangle({
      x: marginX,
      y: y - 4,
      width: width - marginX * 2,
      height: 22,
      color: BRAND_LIGHT,
      borderColor: BRAND,
      borderWidth: 0.5,
      borderOpacity: 0.4,
    });
    page.drawText(sanitize(title), {
      x: marginX + 8,
      y: y + 3,
      size: 10,
      font: fontB,
      color: BRAND,
    });
    y -= 22 + 6;
  }

  function drawHR() {
    ensureSpace(12);
    page.drawLine({
      start: { x: marginX, y },
      end: { x: width - marginX, y },
      thickness: 0.4,
      color: LIGHT,
    });
    y -= 10;
  }

  function drawKV(label: string, value: string, indent = 0) {
    ensureSpace(16);
    const lw = fontB.widthOfTextAtSize(sanitize(label) + "  ", 10);
    page.drawText(sanitize(label), {
      x: marginX + indent,
      y,
      size: 10,
      font: fontB,
      color: MID,
    });
    // value (puede ser largo, usar drawText)
    const startX = marginX + indent + lw;
    const safeVal = sanitize(value);
    const maxW = width - marginX - startX;
    const words = safeVal.split(/\s+/);
    let line = "";
    const valLines: string[] = [];
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(test, 10) > maxW && line) {
        valLines.push(line); line = w;
      } else { line = test; }
    }
    if (line) valLines.push(line);
    for (let i = 0; i < valLines.length; i++) {
      ensureSpace(14);
      page.drawText(valLines[i], {
        x: i === 0 ? startX : marginX + indent + lw,
        y,
        size: 10,
        font,
        color: DARK,
      });
      if (i < valLines.length - 1) y -= 14;
    }
    y -= 16;
  }

  function drawFooter() {
    const pn = pageNum + 1;
    const footerY = 28;
    page.drawLine({
      start: { x: marginX, y: footerY + 12 },
      end: { x: width - marginX, y: footerY + 12 },
      thickness: 0.4,
      color: LIGHT,
    });
    page.drawText("Lic. Candela Berardi - Psicologa Infantil", {
      x: marginX,
      y: footerY,
      size: 8,
      font,
      color: MID,
    });
    const pnText = `Pagina ${pn}`;
    const pnW = font.widthOfTextAtSize(pnText, 8);
    page.drawText(pnText, {
      x: width - marginX - pnW,
      y: footerY,
      size: 8,
      font,
      color: MID,
    });
  }

  function drawPageHeader() {
    // línea superior sutil
    page.drawLine({
      start: { x: marginX, y: height - 30 },
      end: { x: width - marginX, y: height - 30 },
      thickness: 0.4,
      color: LIGHT,
    });
    page.drawText(sanitize(`${paciente!.apellido}, ${paciente!.nombre}`), {
      x: marginX,
      y: height - 44,
      size: 8,
      font: fontB,
      color: MID,
    });
    y = height - 58;
  }

  // ─── PORTADA / CABECERA ──────────────────────────────────────────────────

  // Banda de color en el tope
  page.drawRectangle({
    x: 0,
    y: height - 72,
    width,
    height: 72,
    color: BRAND,
  });

  // Nombre de la profesional
  page.drawText("Lic. Candela Berardi", {
    x: marginX,
    y: height - 32,
    size: 14,
    font: fontB,
    color: WHITE,
  });
  page.drawText("Psicologa Infantil", {
    x: marginX,
    y: height - 50,
    size: 10,
    font,
    color: rgb(0.9, 0.8, 0.85),
  });

  // Documento label a la derecha
  const docLabel = "Historia Clinica";
  const dlW = fontB.widthOfTextAtSize(docLabel, 12);
  page.drawText(docLabel, {
    x: width - marginX - dlW,
    y: height - 38,
    size: 12,
    font: fontB,
    color: WHITE,
  });
  const genLabel = `Generado: ${fmtDate(new Date())}`;
  const glW = font.widthOfTextAtSize(genLabel, 8);
  page.drawText(genLabel, {
    x: width - marginX - glW,
    y: height - 54,
    size: 8,
    font,
    color: rgb(0.9, 0.8, 0.85),
  });

  y = height - 90;

  // Nombre del paciente grande
  page.drawText(sanitize(`${paciente.apellido}, ${paciente.nombre}`), {
    x: marginX,
    y,
    size: 18,
    font: fontB,
    color: BRAND,
  });
  y -= 24;

  // Meta-info del paciente en una línea
  const meta: string[] = [];
  if (paciente.fechaNacimiento) meta.push(`Nac: ${fmtDate(paciente.fechaNacimiento)}`);
  meta.push(paciente.tipo === "obra_social" ? `OS: ${paciente.obraSocialNombre ?? "-"}` : "Particular");
  meta.push(`${paciente.sesiones.length} sesion${paciente.sesiones.length !== 1 ? "es" : ""}`);
  page.drawText(sanitize(meta.join("   |   ")), {
    x: marginX,
    y,
    size: 9,
    font,
    color: MID,
  });
  y -= 20;

  drawHR();

  // ─── DATOS DEL PACIENTE ──────────────────────────────────────────────────

  drawSectionHeader("Datos del Paciente");

  drawKV("Apellido y nombre:", `${paciente.apellido}, ${paciente.nombre}`);
  if (paciente.fechaNacimiento)
    drawKV("Fecha de nacimiento:", fmtDate(paciente.fechaNacimiento));
  if (paciente.telefono) drawKV("Telefono:", paciente.telefono);
  if (paciente.email) drawKV("Email:", paciente.email);
  if (paciente.direccion) drawKV("Direccion:", paciente.direccion);
  y -= 4;

  if (paciente.tutorNombre || paciente.tutorTelefono || paciente.tutorDni) {
    drawSectionHeader("Tutor / Responsable");
    if (paciente.tutorNombre) drawKV("Nombre:", paciente.tutorNombre);
    if (paciente.tutorRelacion) drawKV("Relacion:", paciente.tutorRelacion);
    if (paciente.tutorTelefono) drawKV("Telefono:", paciente.tutorTelefono);
    if (paciente.tutorDni) drawKV("DNI:", paciente.tutorDni);
    y -= 4;
  }

  drawSectionHeader("Tipo de Atencion");
  drawKV(
    "Modalidad:",
    paciente.tipo === "obra_social" ? "Obra social" : "Particular"
  );
  if (paciente.tipo === "obra_social") {
    if (paciente.obraSocialNombre)
      drawKV("Obra social:", paciente.obraSocialNombre);
    if (paciente.numeroAfiliado)
      drawKV("N? afiliado:", paciente.numeroAfiliado);
    if (paciente.sesionesAutorizadas != null)
      drawKV(
        "Sesiones autorizadas:",
        String(paciente.sesionesAutorizadas)
      );
  }
  drawKV(
    "Importe por sesion:",
    `$${paciente.importeSesion.toLocaleString("es-AR")}`
  );
  y -= 4;

  if (paciente.motivoConsulta || paciente.diagnostico || paciente.notasGenerales) {
    drawSectionHeader("Informacion Clinica");
    if (paciente.motivoConsulta) {
      drawText("Motivo de consulta", {
        bold: true,
        color: MID,
        size: 9.5,
        gap: 2,
      });
      drawText(paciente.motivoConsulta, { indent: 10, gap: 6 });
    }
    if (paciente.diagnostico) {
      drawText("Diagnostico / hipotesis", {
        bold: true,
        color: MID,
        size: 9.5,
        gap: 2,
      });
      drawText(paciente.diagnostico, { indent: 10, gap: 6 });
    }
    if (paciente.notasGenerales) {
      drawText("Notas generales", {
        bold: true,
        color: MID,
        size: 9.5,
        gap: 2,
      });
      drawText(paciente.notasGenerales, { indent: 10, gap: 6 });
    }
  }

  // ─── SESIONES ────────────────────────────────────────────────────────────

  ensureSpace(40);
  drawSectionHeader(
    `Evolucion Clinica  (${paciente.sesiones.length} sesion${paciente.sesiones.length !== 1 ? "es" : ""})`
  );

  if (paciente.sesiones.length === 0) {
    drawText("Aun no se registraron sesiones.", { color: MID });
  } else {
    paciente.sesiones.forEach((s, i) => {
      ensureSpace(50);

      // Encabezado de sesión con fondo muy suave
      page.drawRectangle({
        x: marginX,
        y: y - 2,
        width: width - marginX * 2,
        height: 18,
        color: rgb(0.97, 0.97, 0.97),
        borderColor: LIGHT,
        borderWidth: 0.5,
      });
      page.drawText(
        sanitize(`Sesion ${i + 1}  -  ${fmtDate(s.fecha)}`),
        { x: marginX + 8, y: y + 1, size: 9.5, font: fontB, color: DARK }
      );
      // cobrado
      const cobLabel = s.turnoId ? (
        // no sabemos sin join, omitir
        ""
      ) : "";
      if (cobLabel) {
        page.drawText(sanitize(cobLabel), {
          x: width - marginX - 60,
          y: y + 1,
          size: 8,
          font,
          color: SAGE,
        });
      }
      y -= 22;

      drawText(s.resumen, { indent: 8, gap: 4 });

      if (s.objetivos) {
        drawText("Objetivos:", {
          indent: 8,
          bold: true,
          color: MID,
          size: 9.5,
          gap: 1,
        });
        drawText(s.objetivos, { indent: 16, gap: 4 });
      }

      if (s.proximosPasos) {
        drawText("Proximos pasos:", {
          indent: 8,
          bold: true,
          color: MID,
          size: 9.5,
          gap: 1,
        });
        drawText(s.proximosPasos, { indent: 16, gap: 4 });
      }

      if (i < paciente.sesiones.length - 1) drawHR();
    });
  }

  drawFooter();
  const bytes = await pdf.save();
  const safeName = `${paciente.apellido}_${paciente.nombre}`
    .replace(/[^a-z0-9_\-]/gi, "_")
    .toLowerCase();

  return new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="historia_${safeName}.pdf"`,
    },
  });
}
