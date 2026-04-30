import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { put } from "@vercel/blob";
import { rateLimit, getIp } from "@/lib/ratelimit";
import { auditLog } from "@/lib/audit";

export const runtime = "nodejs";

const ALLOWED_MIME_PREFIXES = [
  "image/",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-",
];

function isMimeAllowed(mime: string) {
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
}

const ALLOWED_MAGIC = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/zip",    // DOCX, XLSX, PPTX (OOXML son ZIPs)
  "application/msword", // DOC, XLS, PPT (formato OLE legacy)
]);

function detectMagicType(buf: Buffer): string | null {
  if (buf.length < 4) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (buf.length >= 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";
  if (buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04) return "application/zip";
  if (buf[0] === 0xD0 && buf[1] === 0xCF && buf[2] === 0x11 && buf[3] === 0xE0) return "application/msword";
  // Ejecutables
  if (buf[0] === 0x7F && buf[1] === 0x45 && buf[2] === 0x4C && buf[3] === 0x46) return "application/x-elf";
  if (buf[0] === 0x4D && buf[1] === 0x5A) return "application/x-msdownload";
  if ((buf[0] === 0xCE || buf[0] === 0xCF) && buf[1] === 0xFA && buf[2] === 0xED && buf[3] === 0xFE) return "application/x-mach-binary";
  return null;
}

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pacienteId = searchParams.get("pacienteId");
  if (!pacienteId || isNaN(Number(pacienteId))) {
    return NextResponse.json({ error: "pacienteId requerido" }, { status: 400 });
  }
  const archivos = await prisma.archivo.findMany({
    where: { pacienteId: Number(pacienteId) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(archivos);
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`upload:${getIp(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiadas subidas. Intentá de nuevo en 1 hora." },
      { status: 429 }
    );
  }

  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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

  const mimeType = file.type || "application/octet-stream";
  if (!isMimeAllowed(mimeType)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Solo imágenes, PDF y documentos de Office." },
      { status: 400 }
    );
  }

  const headBuf = Buffer.from(await file.slice(0, 12).arrayBuffer());
  const detectedMime = detectMagicType(headBuf);
  if (detectedMime !== null && !ALLOWED_MAGIC.has(detectedMime)) {
    return NextResponse.json(
      { error: "El contenido del archivo no coincide con un tipo permitido." },
      { status: 400 }
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 100);
  const blobPath = `archivos/${pacienteId}/${Date.now()}-${safeName}`;

  const blob = await put(blobPath, file, { access: "public" });

  const archivo = await prisma.archivo.create({
    data: {
      pacienteId,
      nombre: file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_").slice(0, 255),
      ruta: blob.url,
      tipo: file.type || "application/octet-stream",
      tamano: file.size,
    },
  });

  await auditLog({ usuarioId: Number(s.sub), action: "file_upload", resourceType: "archivo", resourceId: archivo.id, ipAddress: getIp(req) });
  return NextResponse.json(archivo, { status: 201 });
}
