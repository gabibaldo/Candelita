"use client";
import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, CalendarDays, FileText, Paperclip, Target, Plus, Check, Search } from "lucide-react";
import Link from "next/link";
import SessionForm from "@/components/SessionForm";
import SessionList from "@/components/SessionList";
import ArchivosSection from "@/components/ArchivosSection";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { TurnoModal, type PacienteMini } from "@/components/Calendar";

type Tab = "info" | "turnos" | "historia" | "archivos";

type Turno = {
  id: number;
  inicio: string;
  estado: string;
  confirmado: boolean;
  cobrado: boolean;
  sesion: { id: number } | null;
};

type Sesion = {
  id: number;
  fecha: string;
  tipo: string;
  resumen: string;
  objetivos: string | null;
  proximosPasos: string | null;
};

type Paciente = {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string | null;
  telefono: string | null;
  celular: string | null;
  email: string | null;
  direccion: string | null;
  tutorNombre: string | null;
  tutorTelefono: string | null;
  tutorDni: string | null;
  tutorRelacion: string | null;
  tipo: string;
  obraSocialNombre: string | null;
  numeroAfiliado: string | null;
  sesionesAutorizadas: number | null;
  importeSesion: number | null;
  motivoConsulta: string | null;
  diagnostico: string | null;
  objetivosTerapeuticos: string | null;
  derivaciones: string | null;
  notasGenerales: string | null;
  turnos: Turno[];
  sesiones: Sesion[];
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

const TABS: { key: Tab; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { key: "info",     label: "Información",     shortLabel: "Info",     icon: User },
  { key: "turnos",   label: "Turnos",          shortLabel: "Turnos",   icon: CalendarDays },
  { key: "historia", label: "Historia clínica",shortLabel: "Historia", icon: FileText },
  { key: "archivos", label: "Archivos",        shortLabel: "Archivos", icon: Paperclip },
];

// ── Helpers objetivos terapéuticos ─────────────────────────────────────────
function parseObjetivos(text: string | null): Array<{ texto: string; logrado: boolean }> {
  if (!text?.trim()) return [];
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => ({
    logrado: /^\[x\]/i.test(l),
    texto: l.replace(/^\[.?\]\s*/, ""),
  }));
}
function serializeObjetivos(items: Array<{ texto: string; logrado: boolean }>): string {
  return items.map((i) => `${i.logrado ? "[x]" : "[ ]"} ${i.texto}`).join("\n");
}

function ObjetivosChecklist({ pacienteId, initialText }: { pacienteId: number; initialText: string | null }) {
  const [items, setItems] = useState(() => parseObjetivos(initialText));
  const [nuevo, setNuevo] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function save(next: typeof items) {
    setItems(next);
    setSaving(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetch(`/api/pacientes/${pacienteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objetivosTerapeuticos: serializeObjetivos(next) }),
      });
      setSaving(false);
    }, 600);
  }

  function toggle(i: number) {
    save(items.map((item, idx) => idx === i ? { ...item, logrado: !item.logrado } : item));
  }

  function agregar() {
    if (!nuevo.trim()) return;
    save([...items, { texto: nuevo.trim(), logrado: false }]);
    setNuevo("");
  }

  function eliminar(i: number) {
    save(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="mt-5 pt-4 border-t border-ink-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-brand-600 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" /> Objetivos terapéuticos
        </p>
        {saving && <span className="text-[10px] text-ink-400">Guardando…</span>}
      </div>
      {items.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 group">
              <button
                onClick={() => toggle(i)}
                className={`shrink-0 mt-0.5 w-4 h-4 rounded border transition flex items-center justify-center ${
                  item.logrado ? "bg-sage-500 border-sage-500 text-white" : "border-ink-300 hover:border-brand-400"
                }`}
              >
                {item.logrado && <Check className="w-2.5 h-2.5" />}
              </button>
              <span className={`text-sm flex-1 leading-snug ${item.logrado ? "line-through text-ink-400" : "text-ink-800"}`}>
                {item.texto}
              </span>
              <button
                onClick={() => eliminar(i)}
                className="opacity-0 group-hover:opacity-100 transition text-ink-300 hover:text-red-500 text-xs shrink-0 mt-0.5"
              >✕</button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          className="input text-sm flex-1 h-8"
          placeholder="Nuevo objetivo…"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregar(); } }}
        />
        <button onClick={agregar} disabled={!nuevo.trim()} className="btn-primary text-xs py-1 px-3 h-8">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function PacienteTabs({ paciente }: { paciente: Paciente }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as Tab | null;
  const turnoParam = searchParams.get("turno");
  const [showNewTurno, setShowNewTurno] = useState(false);

  // Estado de sesiones centralizado aquí para que SessionForm y SessionList compartan la misma fuente
  const [sesiones, setSesiones] = useState<Sesion[]>(paciente.sesiones);

  function handleSesionSaved(nueva: Sesion) {
    setSesiones((prev) =>
      [nueva, ...prev].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )
    );
  }

  function handleSesionUpdated(updated: Sesion) {
    setSesiones((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function handleSesionDeleted(id: number) {
    setSesiones((prev) => prev.filter((s) => s.id !== id));
  }

  // Si viene de un turno, abrir la tab correcta y pre-cargar fecha + vínculo
  const linkedTurno = turnoParam
    ? paciente.turnos.find((t) => t.id === Number(turnoParam))
    : null;
  const initialFecha = linkedTurno
    ? new Date(linkedTurno.inicio)
        .toLocaleString("sv", { timeZone: "America/Argentina/Buenos_Aires" })
        .replace(" ", "T")
        .slice(0, 16)
    : undefined;
  const initialTurnoId = linkedTurno ? String(linkedTurno.id) : undefined;

  const [tab, setTab] = useState<Tab>(
    tabParam && ["info", "turnos", "historia", "archivos"].includes(tabParam)
      ? tabParam
      : "info"
  );
  const isOS = paciente.tipo === "obra_social";

  // Filtros historia clínica
  const [filtroTipo, setFiltroTipo] = useState<"all" | "sesion" | "nota">("all");
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const sesionesFiltradas = sesiones.filter((s) => {
    if (filtroTipo !== "all" && s.tipo !== filtroTipo) return false;
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase();
      if (
        !s.resumen.toLowerCase().includes(q) &&
        !s.objetivos?.toLowerCase().includes(q) &&
        !s.proximosPasos?.toLowerCase().includes(q)
      ) return false;
    }
    if (filtroDesde && new Date(s.fecha) < new Date(filtroDesde + "T00:00:00-03:00")) return false;
    if (filtroHasta && new Date(s.fecha) > new Date(filtroHasta + "T23:59:59-03:00")) return false;
    return true;
  });

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex border-b border-ink-200 overflow-x-auto scrollbar-none -mb-px">
        {TABS.map(({ key, label, shortLabel, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              "flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 " +
              (tab === key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300")
            }
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
            {key === "historia" && sesiones.length > 0 && (
              <span className="ml-1 text-[10px] bg-brand-100 text-brand-700 rounded-full px-1.5 py-0.5 font-semibold leading-none">
                {sesionesFiltradas.length !== sesiones.length
                  ? `${sesionesFiltradas.length}/${sesiones.length}`
                  : sesiones.length}
              </span>
            )}
            {key === "turnos" && paciente.turnos.length > 0 && (
              <span className="ml-1 text-[10px] bg-ink-100 text-ink-600 rounded-full px-1.5 py-0.5 font-semibold leading-none">
                {paciente.turnos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-5">

        {/* ── Información ── */}
        {tab === "info" && (
          <div className="card p-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Item label="Fecha de nacimiento" value={formatDate(paciente.fechaNacimiento)} />
              <Item label="Teléfono" value={paciente.telefono ?? "—"} />
              <Item label="Celular" value={paciente.celular ?? "—"} />
              <Item label="Email" value={paciente.email ?? "—"} />
              <Item label="Dirección" value={paciente.direccion ?? "—"} />
              <Item label="Tutor" value={paciente.tutorNombre ?? "—"} />
              <Item label="Tel. tutor" value={paciente.tutorTelefono ?? "—"} />
              <Item label="DNI tutor" value={paciente.tutorDni ?? "—"} />
              <Item label="Relación" value={paciente.tutorRelacion ?? "—"} />
              {isOS && (
                <>
                  <Item label="N° afiliado" value={paciente.numeroAfiliado ?? "—"} />
                  <Item label="Sesiones autorizadas" value={paciente.sesionesAutorizadas?.toString() ?? "—"} />
                  {paciente.sesionesAutorizadas != null && (() => {
                    const realizadas = sesiones.filter((s) => s.tipo !== "nota").length;
                    const restantes = paciente.sesionesAutorizadas! - realizadas;
                    const pct = Math.min(100, Math.round((realizadas / paciente.sesionesAutorizadas!) * 100));
                    const alerta = restantes <= 3;
                    return (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-ink-500 mb-1">Sesiones restantes</dt>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${alerta ? "bg-amber-400" : "bg-sage-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold tabular-nums ${alerta ? "text-amber-700" : "text-sage-700"}`}>
                            {restantes > 0 ? `${restantes} restantes` : "sin sesiones restantes"}
                          </span>
                        </div>
                        <p className="text-xs text-ink-400 mt-0.5">{realizadas} de {paciente.sesionesAutorizadas} sesiones realizadas</p>
                      </div>
                    );
                  })()}
                </>
              )}
              <Item label="Importe por sesión" value={formatMoney(paciente.importeSesion)} />
            </dl>

            {paciente.motivoConsulta && (
              <div className="mt-5 pt-4 border-t border-ink-100">
                <p className="text-xs font-medium text-ink-500 mb-1">Motivo de consulta</p>
                <p className="text-sm whitespace-pre-wrap">{paciente.motivoConsulta}</p>
              </div>
            )}
            {paciente.diagnostico && (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-500 mb-1">Diagnóstico / hipótesis</p>
                <p className="text-sm whitespace-pre-wrap">{paciente.diagnostico}</p>
              </div>
            )}
            <ObjetivosChecklist
              pacienteId={paciente.id}
              initialText={paciente.objetivosTerapeuticos}
            />
            {paciente.derivaciones && (
              <div className="mt-4 pt-4 border-t border-ink-100">
                <p className="text-xs font-semibold text-brand-600 mb-1.5">Derivaciones</p>
                <p className="text-sm whitespace-pre-wrap text-ink-700">{paciente.derivaciones}</p>
              </div>
            )}
            {paciente.notasGenerales && (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-500 mb-1">Notas generales</p>
                <p className="text-sm whitespace-pre-wrap">{paciente.notasGenerales}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Turnos ── */}
        {tab === "turnos" && (
          <div className="space-y-3">
            {/* Resumen de deuda */}
            {(() => {
              const realizados = paciente.turnos.filter(t => t.estado === "realizado");
              const sinCobrar = realizados.filter(t => !t.cobrado).length;
              const monto = sinCobrar * (paciente.importeSesion ?? 0);
              if (sinCobrar === 0) return null;
              return (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-amber-800 font-medium">
                    {sinCobrar} sesión{sinCobrar !== 1 ? "es" : ""} sin cobrar
                  </p>
                  {monto > 0 && (
                    <p className="text-sm font-semibold text-amber-900">{formatMoney(monto)}</p>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewTurno(true)}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nuevo turno
              </button>
            </div>
            {paciente.turnos.length === 0 ? (
              <div className="card p-6 text-center text-ink-400">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin turnos aún.</p>
              </div>
            ) : (
              <div className="card divide-y divide-ink-100">
                {paciente.turnos.map((t) => {
                  const sinSesion = t.estado === "realizado" && !t.sesion;
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50/50 transition">
                      <div className="min-w-0">
                        <p className="text-xs text-ink-500">{formatDateTime(t.inicio)}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className={
                            "text-[11px] px-1.5 py-0.5 rounded-full font-medium " +
                            (t.estado === "realizado" ? "bg-sage-100 text-sage-700" :
                             t.estado === "cancelado" || t.estado === "ausente" ? "bg-ink-100 text-ink-500" :
                             "bg-blue-50 text-blue-700")
                          }>
                            {t.estado}
                          </span>
                          {t.confirmado && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">
                              ✓ conf.
                            </span>
                          )}
                          {sinSesion && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                              ⚠ sin sesión
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={
                        "text-xs shrink-0 font-medium " +
                        (t.cobrado ? "text-sage-700" : "text-amber-700")
                      }>
                        {t.cobrado ? "cobrado" : "sin cobrar"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <Link
              href={`/calendario?paciente=${paciente.id}`}
              className="text-xs text-brand-700 hover:underline inline-block"
            >
              Ver en calendario →
            </Link>
          </div>
        )}

        {/* ── Historia clínica ── */}
        {tab === "historia" && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="card p-3 space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1">
                  {(["all", "sesion", "nota"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFiltroTipo(t)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition font-medium ${
                        filtroTipo === t
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white text-ink-500 border-ink-200 hover:border-brand-400"
                      }`}
                    >
                      {t === "all" ? "Todas" : t === "sesion" ? "Sesiones" : "Notas"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 flex-1 min-w-[160px] border border-ink-200 rounded-lg px-2.5 h-8 bg-white">
                  <Search className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                  <input
                    type="text"
                    className="text-sm flex-1 bg-transparent outline-none placeholder:text-ink-400"
                    placeholder="Buscar en sesiones…"
                    value={filtroBusqueda}
                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-[11px] text-ink-400 shrink-0">Período:</span>
                <input type="date" className="input text-xs h-7 flex-1 min-w-[120px]" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
                <span className="text-[11px] text-ink-400">→</span>
                <input type="date" className="input text-xs h-7 flex-1 min-w-[120px]" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
                {(filtroDesde || filtroHasta || filtroBusqueda || filtroTipo !== "all") && (
                  <button
                    onClick={() => { setFiltroDesde(""); setFiltroHasta(""); setFiltroBusqueda(""); setFiltroTipo("all"); }}
                    className="text-[11px] text-ink-400 hover:text-ink-700 transition"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            <SessionForm
              pacienteId={paciente.id}
              turnos={paciente.turnos.map((t) => ({
                id: t.id,
                inicio: t.inicio,
              }))}
              initialFecha={initialFecha}
              initialTurnoId={initialTurnoId}
              onSaved={handleSesionSaved}
            />
            <SessionList
              sesiones={sesionesFiltradas}
              onUpdated={handleSesionUpdated}
              onDeleted={handleSesionDeleted}
            />
          </div>
        )}

        {/* ── Archivos ── */}
        {tab === "archivos" && (
          <ArchivosSection pacienteId={paciente.id} />
        )}
      </div>

      {showNewTurno && (() => {
        const now = new Date();
        const start = new Date(now);
        start.setMinutes(0, 0, 0);
        const end = new Date(start.getTime() + 45 * 60_000);
        const pacienteMini: PacienteMini = {
          id: paciente.id,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          tipo: paciente.tipo,
          importeSesion: paciente.importeSesion ?? 0,
          obraSocialNombre: paciente.obraSocialNombre,
        };
        return (
          <TurnoModal
            pacientes={[pacienteMini]}
            data={{ kind: "create", inicio: start, fin: end }}
            onClose={() => {
              setShowNewTurno(false);
              router.refresh();
            }}
          />
        );
      })()}
    </div>
  );
}
