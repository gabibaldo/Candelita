"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, FileText, X } from "lucide-react";

type SearchResult = {
  pacientes: Array<{
    id: number;
    nombre: string;
    apellido: string;
    tipo: string;
    obraSocialNombre: string | null;
    diagnostico: string | null;
  }>;
  sesiones: Array<{
    id: number;
    fecha: string;
    resumen: string;
    paciente: { id: number; nombre: string; apellido: string };
  }>;
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult>({ pacientes: [], sesiones: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
    else { setQ(""); setResults({ pacientes: [], sesiones: [] }); }
  }, [open]);

  useEffect(() => {
    if (q.length < 2) { setResults({ pacientes: [], sesiones: [] }); return; }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/buscar?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { setResults(d); setLoading(false); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [q]);

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  if (!open) return null;

  const total = results.pacientes.length + results.sesiones.length;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-center pt-[10vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-100">
          <Search className="w-4 h-4 text-ink-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar pacientes o sesiones…"
            className="flex-1 bg-transparent text-sm text-ink-800 placeholder:text-ink-400 outline-none"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-ink-300 hover:text-ink-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-ink-100 text-ink-400 px-1.5 py-0.5 rounded font-mono hidden sm:block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {q.length < 2 && (
            <p className="text-center text-xs text-ink-300 py-6">
              Escribí al menos 2 caracteres para buscar
            </p>
          )}
          {q.length >= 2 && loading && (
            <p className="text-center text-xs text-ink-400 py-6">Buscando…</p>
          )}
          {q.length >= 2 && !loading && total === 0 && (
            <p className="text-center text-xs text-ink-400 py-6">
              Sin resultados para &ldquo;{q}&rdquo;
            </p>
          )}

          {results.pacientes.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-semibold text-ink-400 uppercase tracking-wider border-b border-ink-50 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Pacientes
              </p>
              {results.pacientes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(`/pacientes/${p.id}`)}
                  className="w-full text-left px-4 py-2.5 hover:bg-brand-50 transition flex items-center gap-3 border-b border-ink-50"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      p.tipo === "obra_social"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {p.apellido[0].toUpperCase()}{p.nombre[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800">
                      {p.apellido}, {p.nombre}
                    </p>
                    {p.diagnostico && (
                      <p className="text-xs text-ink-400 truncate italic">{p.diagnostico}</p>
                    )}
                  </div>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                      p.tipo === "obra_social"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {p.tipo === "obra_social" ? (p.obraSocialNombre ?? "OS") : "Part."}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.sesiones.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-semibold text-ink-400 uppercase tracking-wider border-b border-ink-50 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Sesiones
              </p>
              {results.sesiones.map((s) => (
                <button
                  key={s.id}
                  onClick={() => go(`/pacientes/${s.paciente.id}?tab=historia`)}
                  className="w-full text-left px-4 py-2.5 hover:bg-brand-50 transition border-b border-ink-50"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-brand-700">
                      {s.paciente.apellido}, {s.paciente.nombre}
                    </span>
                    <span className="text-[10px] text-ink-400">
                      {new Date(s.fecha).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        timeZone: "America/Argentina/Buenos_Aires",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-ink-600 line-clamp-2">{s.resumen}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
