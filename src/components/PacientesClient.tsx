"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, UserX } from "lucide-react";
import { edadDesde } from "@/lib/utils";

type SortKey = "apellido" | "sesiones" | "turnos";

type Paciente = {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string | null;
  tipo: string;
  obraSocialNombre: string | null;
  importeSesion: number;
  diagnostico: string | null;
  tutorNombre: string | null;
  activo: boolean;
  ultimoTurno: string | null;
  _count: { sesiones: number; turnos: number };
};

const INACTIVO_SEMANAS = 4;
function semanasSinTurno(ultimoTurno: string | null): number | null {
  if (!ultimoTurno) return null;
  const diff = Date.now() - new Date(ultimoTurno).getTime();
  return Math.floor(diff / (7 * 24 * 3600 * 1000));
};

export default function PacientesClient() {
  const [q, setQ] = useState("");
  const [inactivos, setInactivos] = useState(false);
  const [sort, setSort] = useState<SortKey>("apellido");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (!inactivos) params.set("activo", "true");
      const res = await fetch("/api/pacientes?" + params.toString());
      if (res.ok) setPacientes(await res.json());
      setLoading(false);
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [q, inactivos]);

  function sortedPacientes() {
    const list = [...pacientes];
    if (sort === "sesiones") return list.sort((a, b) => b._count.sesiones - a._count.sesiones);
    if (sort === "turnos") return list.sort((a, b) => b._count.turnos - a._count.turnos);
    return list.sort((a, b) =>
      a.apellido.localeCompare(b.apellido, "es") || a.nombre.localeCompare(b.nombre, "es")
    );
  }

  const lista = sortedPacientes();

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">Pacientes</h1>
          <p className="text-sm text-ink-500">
            {loading
              ? "Buscando…"
              : `${pacientes.length} ${pacientes.length === 1 ? "paciente" : "pacientes"}`}
          </p>
        </div>
        <Link href="/pacientes/nuevo" className="btn-primary">
          + Nuevo paciente
        </Link>
      </header>

      <div className="card p-4 space-y-3">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, apellido o tutor…"
            className="input pl-10 pr-9 w-full h-11 rounded-xl text-sm"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros secundarios */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-ink-400 font-medium uppercase tracking-wider mr-0.5">
            Ordenar
          </span>
          <div className="flex items-center gap-0.5 bg-ink-100/60 rounded-lg p-0.5">
            {(["apellido", "sesiones", "turnos"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  sort === key
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-ink-500 hover:text-ink-700"
                }`}
              >
                {key === "apellido" ? "Apellido" : key === "sesiones" ? "Sesiones" : "Turnos"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setInactivos(!inactivos)}
            className={`ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
              inactivos
                ? "bg-brand-50 text-brand-700 border-brand-200"
                : "bg-white text-ink-500 border-ink-200 hover:border-ink-300 hover:text-ink-700"
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            Inactivos
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-ink-400 text-sm animate-pulse">
          Buscando…
        </div>
      ) : pacientes.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">
          No hay pacientes{q ? " que coincidan con la búsqueda" : ""}.
        </div>
      ) : (
        <ul className="card divide-y">
          {lista.map((p) => (
            <li key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/pacientes/${p.id}`}
                      className="font-semibold hover:underline"
                    >
                      {p.apellido}, {p.nombre}
                    </Link>
                    {edadDesde(p.fechaNacimiento) != null && (
                      <span className="text-xs text-ink-500">
                        {edadDesde(p.fechaNacimiento)} años
                      </span>
                    )}
                    <span
                      className={
                        "chip " +
                        (p.tipo === "obra_social"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800")
                      }
                    >
                      {p.tipo === "obra_social"
                        ? `OS · ${p.obraSocialNombre ?? "—"}`
                        : "Particular"}
                    </span>
                    {!p.activo && (
                      <span className="chip bg-ink-200 text-ink-700">
                        inactivo
                      </span>
                    )}
                    {p.activo && (() => {
                      const sem = semanasSinTurno(p.ultimoTurno);
                      if (sem === null || sem >= INACTIVO_SEMANAS) {
                        return (
                          <span className="chip bg-amber-100 text-amber-700">
                            {sem === null ? "sin turnos" : `${sem}s sin turno`}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <p className="text-xs text-ink-500 mt-1">
                    {p.diagnostico
                      ? <span className="text-ink-600">{p.diagnostico}</span>
                      : <span className="italic">Sin diagnóstico cargado</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Link
                    href={`/pacientes/${p.id}/historia`}
                    className="text-xs text-brand-700 hover:underline"
                  >
                    Ver historia →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
