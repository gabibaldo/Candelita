"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown } from "lucide-react";
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
  _count: { sesiones: number; turnos: number };
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

      <div className="card p-3 flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, apellido o tutor…"
            className="input pl-9 w-full"
          />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-ink-600 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-ink-400" />
          <select
            className="input py-1.5 text-sm w-auto pr-8"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="apellido">Apellido</option>
            <option value="sesiones">Más sesiones</option>
            <option value="turnos">Más turnos</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-600 px-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inactivos}
            onChange={(e) => setInactivos(e.target.checked)}
          />
          Incluir inactivos
        </label>
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
