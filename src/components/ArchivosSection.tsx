"use client";
import { useEffect, useRef, useState } from "react";
import {
  Paperclip,
  Upload,
  Trash2,
  Download,
  FileText,
  Image,
  File,
  Loader2,
} from "lucide-react";

type Archivo = {
  id: number;
  nombre: string;
  tipo: string;
  tamano: number;
  createdAt: string;
};

function fileIcon(tipo: string) {
  if (tipo.startsWith("image/")) return <Image className="w-4 h-4" />;
  if (tipo === "application/pdf") return <FileText className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ArchivosSection({ pacienteId }: { pacienteId: number }) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/archivos?pacienteId=${pacienteId}`);
      if (res.ok) setArchivos(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, [pacienteId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErr("El archivo no puede superar 10 MB.");
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("pacienteId", String(pacienteId));
      const res = await fetch("/api/archivos", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Error al subir el archivo");
      }
      await cargar();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function eliminar(id: number, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/archivos/${id}`, { method: "DELETE" });
    setArchivos((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-1.5">
          <Paperclip className="w-4 h-4" /> Archivos adjuntos
        </h2>
        <label
          className={
            "btn-ghost cursor-pointer text-sm " +
            (uploading ? "opacity-60 pointer-events-none" : "")
          }
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Subiendo…" : "Subir archivo"}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {err && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {err}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 text-ink-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : archivos.length === 0 ? (
        <div className="card p-6 text-center text-ink-400">
          <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin archivos adjuntos</p>
          <p className="text-xs mt-1">Subí informes, autorizaciones, estudios, etc.</p>
        </div>
      ) : (
        <ul className="card divide-y divide-ink-100">
          {archivos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50/50 transition">
              <span className="text-ink-400 shrink-0">{fileIcon(a.tipo)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-800 truncate">{a.nombre}</p>
                <p className="text-xs text-ink-400">
                  {formatBytes(a.tamano)} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    timeZone: "America/Argentina/Buenos_Aires",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`/api/archivos/${a.id}`}
                  download={a.nombre}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-brand-700 hover:bg-brand-50 transition"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => eliminar(a.id, a.nombre)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
