"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import type {
  EventClickArg,
  EventDropArg,
  DateSelectArg,
} from "@fullcalendar/core";
// EventResizeDoneArg vive en @fullcalendar/interaction en algunas versiones y
// en @fullcalendar/core en otras. Definimos un tipo mínimo compatible con ambos.
type ResizeArg = {
  event: EventDropArg["event"];
  revert: EventDropArg["revert"];
};
import Link from "next/link";
import { useToast } from "@/components/Toast";
import PatientCombobox from "@/components/PatientCombobox";

export type PacienteMini = {
  id: number;
  nombre: string;
  apellido: string;
  tipo: string;
  importeSesion: number;
  obraSocialNombre: string | null;
};

type BloqueoDia = {
  id: number;
  inicio: string;
  fin: string;
  motivo: string | null;
};

type TurnoView = {
  id: number;
  pacienteId: number;
  inicio: string;
  fin: string;
  estado: string;
  modalidad: string;
  importe: number | null;
  cobrado: boolean;
  confirmado: boolean;
  notas: string | null;
  sesion: { id: number } | null;
  paciente: PacienteMini & {
    motivoConsulta: string | null;
    diagnostico: string | null;
    obraSocialNombre: string | null;
    tutorNombre: string | null;
    tutorTelefono: string | null;
    telefono: string | null;
  };
};

function colorForPaciente(t: TurnoView) {
  if (t.estado === "cancelado" || t.estado === "ausente")
    return { bg: "#f3f4f6", text: "#6b7280" };
  if (t.modalidad === "virtual")
    return { bg: "#dbeafe", text: "#1e3a8a" };
  if (t.paciente.tipo === "obra_social")
    return { bg: "#ede9fe", text: "#5b21b6" };
  return { bg: "#d1fae5", text: "#065f46" };
}

function needsSesion(t: TurnoView) {
  return t.estado === "realizado" && !t.sesion;
}

export default function Calendar({
  initialPacientes,
  initialPacienteFiltro,
  autoOpenModal = false,
}: {
  initialPacientes: PacienteMini[];
  initialPacienteFiltro?: number;
  autoOpenModal?: boolean;
}) {
  const [turnos, setTurnos] = useState<TurnoView[]>([]);
  const [pacientes, setPacientes] = useState<PacienteMini[]>(initialPacientes);
  const [filtroPaciente, setFiltroPaciente] = useState<number | null>(
    initialPacienteFiltro ?? null
  );
  const [initialView] = useState<string>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return "timeGridDay";
    return "timeGridWeek";
  });
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768; // eslint-disable-line
  const [rango, setRango] = useState<{ from: Date; to: Date } | null>(null);
  const [bloqueos, setBloqueos] = useState<BloqueoDia[]>([]);
  const [showBloqueoForm, setShowBloqueoForm] = useState(false);
  const [bloqueoDate, setBloqueoDate] = useState(() => toARDate(new Date()));
  const [bloqueoMotivo, setBloqueoMotivo] = useState("");
  const [savingBloqueo, setSavingBloqueo] = useState(false);
  const [modal, setModal] = useState<
    | { kind: "create"; inicio: Date; fin: Date }
    | { kind: "edit"; turno: TurnoView }
    | null
  >(null);
  const [hoverTooltip, setHoverTooltip] = useState<{
    time: string;
    x: number;
    y: number;
  } | null>(null);
  const calRef = useRef<FullCalendar>(null);
  const calWrapRef = useRef<HTMLDivElement>(null);

  const cargarBloqueos = useCallback(async () => {
    const res = await fetch("/api/bloqueos");
    if (res.ok) setBloqueos(await res.json());
  }, []);

  useEffect(() => { cargarBloqueos(); }, [cargarBloqueos]);

  async function cargarTurnos(from: Date, to: Date) {
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    if (filtroPaciente) params.set("pacienteId", String(filtroPaciente));
    const res = await fetch("/api/turnos?" + params.toString());
    if (res.ok) setTurnos(await res.json());
  }

  useEffect(() => {
    if (rango) cargarTurnos(rango.from, rango.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroPaciente, rango?.from?.toISOString(), rango?.to?.toISOString()]);

  // Abre el modal de nuevo turno automáticamente (desde botón del dashboard)
  useEffect(() => {
    if (!autoOpenModal) return;
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 45 * 60_000);
    setModal({ kind: "create", inicio: start, fin: end });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const events = useMemo(() => {
    const now = new Date();
    const turnoEvents = turnos.map((t) => {
      const c = colorForPaciente(t);
      const isPast = new Date(t.fin) < now;
      const sinSesion = needsSesion(t);
      const confirmadoIcon = t.confirmado ? " ✓" : "";
      const sesionIcon = sinSesion ? " ⚠" : "";
      const modalidadIcon = t.modalidad === "virtual" ? " 🖥" : "";
      return {
        id: String(t.id),
        title: `${t.paciente.apellido}, ${t.paciente.nombre}${modalidadIcon}${confirmadoIcon}${sesionIcon}`,
        start: t.inicio,
        end: t.fin,
        backgroundColor: c.bg,
        textColor: c.text,
        borderColor: sinSesion ? "#f59e0b" : c.bg,
        display: "block",
        editable: !isPast,
        startEditable: !isPast,
        durationEditable: !isPast,
        extendedProps: { turno: t },
        classNames:
          t.estado === "cancelado" || t.estado === "ausente"
            ? ["opacity-60 line-through"]
            : [],
      };
    });

    const bloqueoEvents = bloqueos
      .filter((b) => {
        if (!rango) return true;
        const inicio = new Date(b.inicio);
        return inicio >= rango.from && inicio <= rango.to;
      })
      .map((b) => {
        const arDate = new Date(b.inicio).toLocaleDateString("en-CA", {
          timeZone: "America/Argentina/Buenos_Aires",
        });
        return {
          id: `bloqueo-${b.id}`,
          title: b.motivo || "Día bloqueado",
          start: `${arDate}T14:00:00-03:00`,
          end: `${arDate}T21:00:00-03:00`,
          display: "background" as const,
          backgroundColor: "#ede9fe",
        };
      });

    return [...turnoEvents, ...bloqueoEvents];
  }, [turnos, bloqueos, rango]);

  async function handleDrop(arg: EventDropArg | ResizeArg) {
    const id = Number(arg.event.id);
    const inicio = arg.event.start!;
    const fin = arg.event.end ?? new Date(inicio.getTime() + 45 * 60_000);
    const res = await fetch(`/api/turnos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      }),
    });
    if (!res.ok) {
      arg.revert();
    } else if (rango) {
      cargarTurnos(rango.from, rango.to);
    }
  }

  function handleSelect(arg: DateSelectArg) {
    setModal({ kind: "create", inicio: arg.start, fin: arg.end });
    calRef.current?.getApi().unselect();
  }

  function handleEventClick(arg: EventClickArg) {
    const t = arg.event.extendedProps.turno as TurnoView;
    setModal({ kind: "edit", turno: t });
  }

  async function refreshPacientes() {
    const res = await fetch("/api/pacientes?activo=true");
    if (res.ok) {
      const all: any[] = await res.json();
      setPacientes(
        all.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          apellido: p.apellido,
          tipo: p.tipo,
          importeSesion: p.importeSesion,
          obraSocialNombre: p.obraSocialNombre,
        }))
      );
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.key === "Escape") {
        setModal(null);
        return;
      }
      if (e.key === "n" || e.key === "N") {
        const now = new Date();
        const start = new Date(now);
        start.setMinutes(0, 0, 0);
        const end = new Date(start.getTime() + 45 * 60_000);
        setModal({ kind: "create", inicio: start, fin: end });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onCalMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slotRow = el?.closest("tr[data-time]") as HTMLElement | null;
    if (!slotRow || !calWrapRef.current?.contains(slotRow)) {
      setHoverTooltip(null);
      return;
    }
    const time = slotRow.getAttribute("data-time"); // "14:30:00"
    if (!time) { setHoverTooltip(null); return; }
    const parts = time.split(":");
    if (parts.length < 2) { setHoverTooltip(null); return; }
    setHoverTooltip({ time: `${parts[0]}:${parts[1]}`, x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div className="space-y-3">
      {hoverTooltip && (
        <div
          className="fixed z-[200] bg-ink-900/90 text-white text-xs font-mono px-2 py-0.5 rounded pointer-events-none shadow"
          style={{ left: hoverTooltip.x + 14, top: hoverTooltip.y - 10 }}
        >
          {hoverTooltip.time}
        </div>
      )}
      <div className="card p-3 flex flex-col gap-2">
        {/* Fila 1: filtro + bloquear */}
        <div className="flex gap-2 items-center">
          <label className="text-sm text-ink-600 shrink-0">Filtrar:</label>
          <PatientCombobox
            pacientes={initialPacientes}
            value={filtroPaciente}
            onChange={setFiltroPaciente}
            placeholder="Todos los pacientes…"
            className="flex-1 min-w-0"
          />
          <button
            type="button"
            onClick={() => setShowBloqueoForm((v) => !v)}
            className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition text-xs font-medium whitespace-nowrap ${
              showBloqueoForm
                ? "bg-violet-100 text-violet-700 border-violet-200"
                : "bg-white text-ink-500 border-ink-200 hover:border-violet-300 hover:text-violet-600"
            }`}
          >
            🚫 Bloquear día
          </button>
        </div>
        {/* Fila 2: leyenda */}
        <div className="flex items-center gap-3 text-xs text-ink-500 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-200 inline-block" />
            Particular
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-violet-200 inline-block" />
            Obra social
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-200 inline-block" />
            Virtual
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-200 inline-block" />
            Cancelado
          </span>
        </div>
      </div>

      {showBloqueoForm && (
        <div className="card p-3 flex flex-wrap gap-3 items-end border-violet-200 bg-violet-50/50">
          <div>
            <label className="label !text-xs !mb-1">Fecha</label>
            <input
              type="date"
              className="input text-sm"
              value={bloqueoDate}
              onChange={(e) => setBloqueoDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="label !text-xs !mb-1">Motivo (opcional)</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="Vacaciones, feriado, supervisión…"
              value={bloqueoMotivo}
              onChange={(e) => setBloqueoMotivo(e.target.value)}
            />
          </div>
          <button
            disabled={!bloqueoDate || savingBloqueo}
            onClick={async () => {
              setSavingBloqueo(true);
              const inicio = new Date(bloqueoDate + "T00:00:00-03:00");
              const fin = new Date(bloqueoDate + "T23:59:59-03:00");
              const res = await fetch("/api/bloqueos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  inicio: inicio.toISOString(),
                  fin: fin.toISOString(),
                  motivo: bloqueoMotivo || null,
                }),
              });
              if (res.ok) {
                await cargarBloqueos();
                setShowBloqueoForm(false);
                setBloqueoMotivo("");
              }
              setSavingBloqueo(false);
            }}
            className="btn-primary text-sm"
          >
            {savingBloqueo ? "Guardando…" : "Bloquear"}
          </button>
          <button
            onClick={() => setShowBloqueoForm(false)}
            className="btn-ghost text-sm"
          >
            Cancelar
          </button>
        </div>
      )}

      {(() => {
        const bloqueosVisibles = bloqueos.filter((b) => {
          if (!rango) return true;
          const inicio = new Date(b.inicio);
          return inicio >= rango.from && inicio < rango.to;
        });
        return (
        <div className="card p-3">
          <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2">
            Días bloqueados
          </p>
          {bloqueosVisibles.length === 0 ? (
            <p className="text-xs text-ink-300 italic">Sin bloqueos en este período</p>
          ) : (
          <ul className="flex flex-wrap gap-2">
            {bloqueosVisibles.map((b) => {
              const label = new Date(b.inicio).toLocaleDateString("es-AR", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                timeZone: "America/Argentina/Buenos_Aires",
              });
              return (
                <li
                  key={b.id}
                  className="flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs px-2.5 py-1 rounded-full border border-violet-200"
                >
                  <span>
                    🚫 {label}
                    {b.motivo ? ` · ${b.motivo}` : ""}
                  </span>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/bloqueos/${b.id}`, { method: "DELETE" });
                      if (res.ok) cargarBloqueos();
                    }}
                    className="ml-0.5 hover:text-red-500 transition leading-none"
                    title="Eliminar bloqueo"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
          )}
        </div>
        );
      })()}

      <div
        ref={calWrapRef}
        className="card p-2"
        onMouseMove={onCalMouseMove}
        onMouseLeave={() => setHoverTooltip(null)}
      >
        <FullCalendar
          ref={calRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin, luxonPlugin]}
          initialView={initialView}
          locale="es"
          firstDay={1}
          allDaySlot={false}
          hiddenDays={[0]}
          slotMinTime="13:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          snapDuration="00:10:00"
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: "13:00",
            endTime: "21:00",
          }}
          selectConstraint="businessHours"
          eventConstraint="businessHours"
          editable
          selectable
          selectMirror
          nowIndicator
          height={580}
          stickyHeaderDates
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: isMobile ? "timeGridDay,dayGridMonth" : "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          buttonText={{
            today: "hoy",
            week: "semana",
            month: "mes",
            day: "día",
          }}
          events={events}
          datesSet={(info) =>
            setRango((prev) => {
              if (
                prev?.from?.toISOString() === info.start.toISOString() &&
                prev?.to?.toISOString() === info.end.toISOString()
              )
                return prev;
              return { from: info.start, to: info.end };
            })
          }
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleDrop}
          eventResize={handleDrop}
          dayMaxEvents={2}
          moreLinkClick={(info) => {
            calRef.current?.getApi().changeView("timeGridDay", info.date);
            return "stop";
          }}
          dateClick={(info) => {
            if (calRef.current?.getApi().view.type === "dayGridMonth") {
              calRef.current.getApi().changeView("timeGridDay", info.date);
            }
          }}
          timeZone="America/Argentina/Buenos_Aires"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
        />
      </div>

      {/* Botón flotante nuevo turno — solo mobile */}
      <button
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-brand-700 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-brand-800 active:scale-95 transition"
        onClick={() => {
          const now = new Date();
          const start = new Date(now);
          start.setMinutes(0, 0, 0);
          const end = new Date(start.getTime() + 45 * 60_000);
          setModal({ kind: "create", inicio: start, fin: end });
        }}
        aria-label="Nuevo turno"
      >
        +
      </button>

      {modal && (
        <TurnoModal
          pacientes={pacientes}
          data={modal}
          onPacienteCreado={refreshPacientes}
          onClose={() => {
            setModal(null);
            if (rango) cargarTurnos(rango.from, rango.to);
          }}
        />
      )}
    </div>
  );
}

export function TurnoModal({
  pacientes,
  data,
  onClose,
  onPacienteCreado,
}: {
  pacientes: PacienteMini[];
  data:
    | { kind: "create"; inicio: Date; fin: Date }
    | { kind: "edit"; turno: TurnoView };
  onClose: () => void;
  onPacienteCreado?: () => Promise<void>;
}) {
  const isEdit = data.kind === "edit";
  const isPastTurno = isEdit && new Date(data.turno.fin) < new Date();
  const [pacienteId, setPacienteId] = useState<number | "">(
    isEdit ? data.turno.pacienteId : pacientes[0]?.id ?? ""
  );
  const selectedPaciente = pacientes.find((p) => p.id === Number(pacienteId)) ?? null;
  const [inicioDate, setInicioDate] = useState(() =>
    toARDate(isEdit ? new Date(data.turno.inicio) : data.inicio)
  );
  const [inicioTime, setInicioTime] = useState(() =>
    toARTime(isEdit ? new Date(data.turno.inicio) : data.inicio)
  );
  const [duracion, setDuracion] = useState<number | null>(() => {
    const ini = isEdit ? new Date(data.turno.inicio) : data.inicio;
    const fin = isEdit ? new Date(data.turno.fin) : data.fin;
    const mins = Math.max(15, Math.round((fin.getTime() - ini.getTime()) / 60_000));
    return [30, 45, 60, 75, 90].includes(mins) ? mins : mins;
  });
  const [estado, setEstado] = useState<string>(
    isEdit ? data.turno.estado : "programado"
  );
  const [modalidad, setModalidad] = useState<string>(
    isEdit ? (data.turno.modalidad ?? "presencial") : "presencial"
  );
  const [importe, setImporte] = useState<string>(
    isEdit ? (data.turno.importe?.toString() ?? "") : ""
  );
  const [cobrado, setCobrado] = useState<boolean>(
    isEdit ? data.turno.cobrado : false
  );
  const [confirmado, setConfirmado] = useState<boolean>(
    isEdit ? data.turno.confirmado : false
  );
  const [notas, setNotas] = useState<string>(
    isEdit ? (data.turno.notas ?? "") : ""
  );
  const [repetir, setRepetir] = useState(false);
  const [semanas, setSemanas] = useState(3);
  const [creandoPaciente, setCreandoPaciente] = useState(false);
  const [npApellido, setNpApellido] = useState("");
  const [npNombre, setNpNombre] = useState("");
  const [npTipo, setNpTipo] = useState<"particular" | "obra_social">("particular");
  const [npImporte, setNpImporte] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notasOpen, setNotasOpen] = useState(!!notas);

  async function crearPacienteRapido() {
    if (!npApellido || !npNombre) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apellido: npApellido,
          nombre: npNombre,
          tipo: npTipo,
          importeSesion: npImporte ? Number(npImporte) : 0,
        }),
      });
      if (!res.ok) throw new Error("No pude crear el paciente");
      const p = await res.json();
      await onPacienteCreado?.();
      setPacienteId(p.id);
      setCreandoPaciente(false);
      setNpApellido(""); setNpNombre(""); setNpImporte("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!pacienteId) {
      setErr("Elegí un paciente.");
      return;
    }
    if (!isEdit) {
      const hoy = toARDate(new Date());
      if (inicioDate < hoy) {
        setErr("No podés crear un turno en una fecha pasada.");
        return;
      }
    }
    if (!inicioDate || !inicioTime) { setErr("Fecha y hora son obligatorias."); return; }
    const inicioISO = new Date(`${inicioDate}T${inicioTime}:00-03:00`);
    if (isNaN(inicioISO.getTime())) { setErr("Fecha u hora inválida."); return; }
    setSaving(true);
    setErr(null);
    try {
      const inicioISO = new Date(`${inicioDate}T${inicioTime}:00-03:00`);
      const payload: any = {
        pacienteId: Number(pacienteId),
        inicio: inicioISO.toISOString(),
        fin: new Date(inicioISO.getTime() + (duracion ?? 45) * 60_000).toISOString(),
        estado,
        modalidad,
        importe: importe === "" ? null : Number(importe),
        cobrado,
        confirmado,
        notas: notas || null,
      };
      if (!isEdit && repetir) payload.repetirSemanas = semanas;
      const url = isEdit ? `/api/turnos/${data.turno.id}` : "/api/turnos";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(
          typeof d.error === "string" ? d.error : "No pude guardar el turno"
        );
      }
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const { confirm } = useToast();

  async function remove() {
    if (!isEdit) return;
    const ok = await confirm({
      title: "¿Eliminar este turno?",
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await fetch(`/api/turnos/${data.turno.id}`, { method: "DELETE" });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const estadoConfig: Record<string, { label: string; cls: string }> = {
    programado: { label: "Programado", cls: "bg-violet-100 text-violet-700" },
    realizado:  { label: "Realizado",  cls: "bg-emerald-100 text-emerald-700" },
    cancelado:  { label: "Cancelado",  cls: "bg-gray-200 text-gray-600" },
    ausente:    { label: "Ausente",    cls: "bg-amber-100 text-amber-700" },
  };
  const notasRequired = estado === "cancelado" || estado === "ausente";
  const showNotas = notasOpen || notasRequired;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[94dvh]"
      >
        {/* Header sticky */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-ink-100 shrink-0">
          <div>
            <h3 className="font-semibold text-ink-900 text-base">
              {isEdit ? "Editar turno" : "Nuevo turno"}
            </h3>
            {isEdit && (
              <div className="flex gap-3 mt-1">
                <Link href={`/api/turnos/${data.turno.id}/recibo`} target="_blank"
                  className="text-xs text-brand-600 hover:underline">Recibo ↗</Link>
                <Link href={`/pacientes/${data.turno.pacienteId}`}
                  className="text-xs text-brand-600 hover:underline">Ver paciente →</Link>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 transition text-xl leading-none mt-0.5">
            ×
          </button>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">

          {/* Paciente */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Paciente</label>
              {!isEdit && !creandoPaciente && (
                <button type="button" className="text-xs text-brand-600 hover:underline"
                  onClick={() => setCreandoPaciente(true)}>
                  + Nuevo
                </button>
              )}
            </div>
            {isPastTurno && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-2">
                Turno pasado — solo podés editar estado, importe y cobro
              </p>
            )}
            {creandoPaciente ? (
              <div className="border border-brand-200 bg-brand-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-brand-700">Nuevo paciente rápido</p>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input text-sm" placeholder="Apellido *"
                    value={npApellido} onChange={(e) => setNpApellido(e.target.value)} />
                  <input className="input text-sm" placeholder="Nombre *"
                    value={npNombre} onChange={(e) => setNpNombre(e.target.value)} />
                  <select className="input text-sm" value={npTipo}
                    onChange={(e) => setNpTipo(e.target.value as "particular" | "obra_social")}>
                    <option value="particular">Particular</option>
                    <option value="obra_social">Obra social</option>
                  </select>
                  <input className="input text-sm" type="number" placeholder="Importe sesión"
                    value={npImporte} onChange={(e) => setNpImporte(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-primary text-sm py-1"
                    onClick={crearPacienteRapido} disabled={!npApellido || !npNombre || saving}>
                    Crear y seleccionar
                  </button>
                  <button type="button" className="btn-ghost text-sm py-1"
                    onClick={() => setCreandoPaciente(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <select
                  className={"input " + (isPastTurno ? "opacity-60 cursor-not-allowed" : "")}
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value ? Number(e.target.value) : "")}
                  disabled={isPastTurno} required>
                  <option value="">— Elegir paciente —</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
                  ))}
                </select>
                {selectedPaciente && (
                  <span className={"chip mt-1.5 inline-flex " +
                    (selectedPaciente.tipo === "obra_social" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800")}>
                    {selectedPaciente.tipo === "obra_social"
                      ? `Obra Social${selectedPaciente.obraSocialNombre ? ` · ${selectedPaciente.obraSocialNombre}` : ""}`
                      : "Particular"}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Fecha + Hora + Duración */}
          <div className={isPastTurno ? "opacity-60 pointer-events-none" : ""}>
            <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide block mb-1.5">Cuándo</label>
            <div className="space-y-2">
              <input type="date" className="input" value={inicioDate}
                min={isEdit ? undefined : toARDate(new Date())}
                onChange={(e) => setInicioDate(e.target.value)}
                disabled={isPastTurno} required />
              <TimePickerInline value={inicioTime} onChange={setInicioTime} disabled={isPastTurno} />
            </div>
            {/* Duración */}
            <div className="mt-3">
              <div className="flex rounded-xl overflow-hidden border border-ink-200 divide-x divide-ink-200">
                {[30, 45, 60, 75, 90].map((d) => (
                  <button key={d} type="button" onClick={() => setDuracion(d)}
                    className={`flex-1 py-2 text-xs font-semibold transition ${
                      duracion === d ? "bg-brand-600 text-white" : "bg-white text-ink-500 hover:bg-brand-50 hover:text-brand-700"
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-1.5 px-0.5">
                {duracion ? (
                  <p className="text-xs text-ink-400 font-mono">
                    {duracion} min · termina{" "}
                    {(() => {
                      const [hStr, mStr] = inicioTime.split(":");
                      const totalMin = parseInt(hStr) * 60 + parseInt(mStr) + duracion;
                      return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")} hs`;
                    })()}
                  </p>
                ) : <span />}
                <div className="flex items-center gap-1">
                  <input type="number" min={15} max={240} placeholder="otro"
                    value={duracion !== null && ![30, 45, 60, 75, 90].includes(duracion) ? duracion : ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v > 0) setDuracion(v);
                      else if (e.target.value === "") setDuracion(45);
                    }}
                    className="w-14 text-center text-xs rounded-lg border border-ink-200 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400" />
                  <span className="text-xs text-ink-400">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide block mb-1.5">Estado</label>
            <div className="flex gap-1.5">
              {(["programado", "realizado", "cancelado", "ausente"] as const).map((e) => (
                <button key={e} type="button" onClick={() => setEstado(e)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                    estado === e ? estadoConfig[e].cls : "bg-ink-50 text-ink-400 hover:bg-ink-100"
                  }`}>
                  {estadoConfig[e].label}
                </button>
              ))}
            </div>
          </div>

          {/* Modalidad + Importe + Cobrado + Confirmado */}
          <div className="space-y-3">
            <div className="flex rounded-xl overflow-hidden border border-ink-200 divide-x divide-ink-200">
              {[
                { val: "presencial", label: "Presencial" },
                { val: "virtual", label: "Virtual" },
              ].map(({ val, label }) => (
                <button key={val} type="button" onClick={() => setModalidad(val)}
                  className={`flex-1 py-2.5 text-sm font-medium transition ${
                    modalidad === val
                      ? val === "virtual" ? "bg-blue-600 text-white" : "bg-brand-600 text-white"
                      : "bg-white text-ink-500 hover:bg-ink-50"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400 pointer-events-none">$</span>
                <input type="number" min={0} step={500} className="input pl-7"
                  value={importe} onChange={(e) => setImporte(e.target.value)}
                  placeholder="Importe" />
              </div>
              <button type="button" onClick={() => setConfirmado(!confirmado)}
                className={`shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold border transition ${
                  confirmado ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-ink-400 border-ink-200 hover:border-ink-300"
                }`}>
                ✓ Confirmado
              </button>
              <button type="button" onClick={() => setCobrado(!cobrado)}
                className={`shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold border transition ${
                  cobrado ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-ink-400 border-ink-200 hover:border-ink-300"
                }`}>
                $ Cobrado
              </button>
            </div>
          </div>

          {/* Sesión rápida */}
          {isEdit && estado === "realizado" && !data.turno.sesion && (
            <SesionRapida turnoId={data.turno.id} pacienteId={data.turno.pacienteId}
              inicioISO={data.turno.inicio} onGuardada={onClose} />
          )}

          {/* Repetir (solo crear) */}
          {!isEdit && (
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
                <input type="checkbox" checked={repetir} onChange={(e) => setRepetir(e.target.checked)} />
                Repetir semanalmente
              </label>
              {repetir && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-ink-400">por</span>
                  <input type="number" min={1} max={52}
                    className="input w-16 text-center py-1.5 text-sm" value={semanas}
                    onChange={(e) => setSemanas(Number(e.target.value))} />
                  <span className="text-ink-400">semanas más</span>
                </div>
              )}
            </div>
          )}

          {/* Notas accordion */}
          <div>
            {!showNotas ? (
              <button type="button" onClick={() => setNotasOpen(true)}
                className="text-xs text-ink-400 hover:text-ink-600 transition flex items-center gap-1">
                <span>+</span> Agregar nota
              </button>
            ) : (
              <div>
                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide block mb-1.5">
                  {notasRequired ? "Motivo" : "Notas"}
                </label>
                <textarea className="textarea text-sm min-h-[72px]"
                  placeholder={notasRequired ? "¿Por qué se canceló o ausentó?" : "Notas del turno…"}
                  value={notas} onChange={(e) => setNotas(e.target.value)} />
              </div>
            )}
          </div>

          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {err}
            </p>
          )}
        </div>

        {/* Footer sticky */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-t border-ink-100 bg-white rounded-b-2xl">
          <div>
            {isEdit && (
              <button type="button" onClick={remove} disabled={saving || isPastTurno}
                title={isPastTurno ? "No se pueden eliminar turnos pasados" : undefined}
                className={"btn-danger text-sm " + (isPastTurno ? "opacity-40 cursor-not-allowed" : "")}>
                Eliminar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost text-sm" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary text-sm" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SesionRapida({
  turnoId,
  pacienteId,
  inicioISO,
  onGuardada,
}: {
  turnoId: number;
  pacienteId: number;
  inicioISO: string;
  onGuardada: () => void;
}) {
  const [resumen, setResumen] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!resumen.trim()) { setErr("El resumen es obligatorio."); return; }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacienteId, turnoId, fecha: inicioISO, resumen }),
      });
      if (!res.ok) throw new Error("No pude guardar la sesión");
      onGuardada();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="border border-brand-200 bg-brand-50/40 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-brand-700">Cargar nota de sesión</p>
      <form onSubmit={guardar} className="space-y-2">
        <textarea
          className="textarea text-sm min-h-[72px]"
          placeholder="Resumen de la sesión…"
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
          required
        />
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-ink-400">Podés ampliar desde la ficha del paciente</p>
          <button className="btn-primary text-xs py-1.5 px-3 shrink-0" disabled={saving}>
            {saving ? "Guardando…" : "Guardar sesión"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TimePickerInline({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [hStr, mStr] = value.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const hours = Array.from({ length: 9 }, (_, i) => 13 + i);
  const mins = [0, 10, 20, 30, 40, 50];

  return (
    <div className={`bg-ink-50 rounded-xl p-3 space-y-2.5 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <p className="text-center text-2xl font-mono font-semibold text-brand-700 tracking-tight leading-none">
        {value} <span className="text-base font-normal text-ink-400">hs</span>
      </p>
      {/* Horas */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {hours.map((hr) => (
          <button
            key={hr}
            type="button"
            onClick={() => onChange(`${String(hr).padStart(2, "0")}:${String(m).padStart(2, "0")}`)}
            className={`shrink-0 w-9 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
              h === hr
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-ink-500 hover:text-brand-700 hover:bg-brand-50 border border-ink-200"
            }`}
          >
            {hr}
          </button>
        ))}
      </div>
      {/* Minutos */}
      <div className="flex gap-1">
        {mins.map((mn) => (
          <button
            key={mn}
            type="button"
            onClick={() => onChange(`${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}`)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
              m === mn
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-ink-500 hover:text-brand-700 hover:bg-brand-50 border border-ink-200"
            }`}
          >
            :{String(mn).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}

// UTC-3 fijo (Argentina sin DST) — no depende del timezone del navegador
function toARDate(d: Date): string {
  const ar = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return ar.toISOString().slice(0, 10);
}

function toARTime(d: Date): string {
  const ar = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  const h = ar.getUTCHours();
  const m = ar.getUTCMinutes();
  const rm = Math.round(m / 10) * 10;
  if (rm === 60) return `${String(h + 1).padStart(2, "0")}:00`;
  return `${String(h).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
}

function timeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 13; h <= 21; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 21 && m > 0) break;
      opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return opts;
}

const TIME_OPTIONS = timeOptions();

const TIME_GROUPS = Array.from({ length: 9 }, (_, i) => {
  const hour = 13 + i;
  const slots = hour < 21
    ? ["00", "10", "20", "30", "40", "50"].map((m) => `${String(hour).padStart(2, "0")}:${m}`)
    : ["21:00"];
  return { hour, slots };
});
