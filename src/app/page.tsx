import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import AgendaWeekWrapper from "@/components/AgendaWeekWrapper";
import QuickNote from "@/components/QuickNote";
import DeudasClient, { type TurnoDeuda } from "@/components/DeudasClient";
import type { TurnoAgenda } from "@/components/AgendaWeekClient";
import { FadeUp, StaggerList, StaggerItem } from "@/components/Animate";
import {
  CalendarDays,
  ArrowRight,
  PlusCircle,
  CalendarPlus,
  Coffee,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Argentina is fixed UTC-3 (no DST)
function arDateStr(d = new Date()) {
  return d.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }); // "2026-04-16"
}

function startOfDayAR(dateStr: string) {
  return new Date(dateStr + "T00:00:00-03:00");
}
function endOfDayAR(dateStr: string) {
  return new Date(dateStr + "T23:59:59.999-03:00");
}

function weekRangeAR() {
  const todayStr = arDateStr();
  const pivot = new Date(todayStr + "T12:00:00-03:00");
  const dow = pivot.getDay(); // 0=Sun
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(pivot);
  monday.setDate(pivot.getDate() + toMonday);
  const mondayStr = arDateStr(monday);
  // La semana termina el sábado (lunes + 5), nunca el domingo
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  const saturdayStr = arDateStr(saturday);
  return {
    start: startOfDayAR(mondayStr),
    end: endOfDayAR(saturdayStr),
    todayStr,
  };
}

function saludo() {
  const hStr = new Date().toLocaleTimeString("en-CA", {
    hour: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const h = parseInt(hStr.split(":")[0], 10);
  if (h >= 6 && h < 13) return "Buen día";
  if (h >= 13 && h < 20) return "Buenas tardes";
  return "Buenas noches"; // 20:00–05:59 incluye madrugada
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function Dashboard() {
  const session = await getSession();
  const now = new Date();

  const { start: weekStart, end: weekEnd, todayStr } = weekRangeAR();
  const todayStart = startOfDayAR(todayStr);
  const todayEnd = endOfDayAR(todayStr);

  const deudaDiasUmbral = 7; // turnos sin cobrar con más de N días
  const umbralDeuda = new Date(now.getTime() - deudaDiasUmbral * 86_400_000);

  const [turnosSemana, proximos, pacientesActivos, turnosSinCobrar] = await Promise.all([
    prisma.turno.findMany({
      where: {
        inicio: { gte: weekStart, lte: weekEnd },
        estado: { in: ["programado", "realizado"] },
      },
      orderBy: { inicio: "asc" },
      include: { paciente: true, sesion: { select: { id: true } } },
    }),
    prisma.turno.findMany({
      where: {
        inicio: { gt: weekEnd },
        estado: "programado",
      },
      orderBy: { inicio: "asc" },
      take: 8,
      include: { paciente: true },
    }),
    prisma.paciente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
    prisma.turno.findMany({
      where: {
        cobrado: false,
        estado: { in: ["programado", "realizado"] },
        inicio: { lte: umbralDeuda },
      },
      orderBy: { inicio: "asc" },
      include: { paciente: { select: { id: true, nombre: true, apellido: true, importeSesion: true } } },
    }),
  ]);

  const turnosHoy = turnosSemana.filter((t) => {
    const d = new Date(t.inicio);
    return d >= todayStart && d <= todayEnd;
  });

  const pendienteHoy = turnosHoy
    .filter((t) => !t.cobrado)
    .reduce((a, t) => a + (t.importe ?? t.paciente.importeSesion ?? 0), 0);

  const proximoTurno = turnosHoy.find((t) => new Date(t.inicio) > now);

  const hoyStr = now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const firstName = session?.nombre?.split(" ")[0] ?? "Cande";

  // Agrupar semana por día
  const byDay = new Map<string, typeof turnosSemana>();
  for (const t of turnosSemana) {
    const key = new Date(t.inicio).toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(t);
  }
  const dias = Array.from(byDay.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  // Generar los 6 días de la semana (lun–sáb) y filtrar a hoy + futuros
  const weekDayKeys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86_400_000);
    return arDateStr(d);
  });
  const visibleDayKeys = weekDayKeys.filter((k) => k >= todayStr);

  // Serializar para el componente cliente
  const agendaTurnos: TurnoAgenda[] = turnosSemana.map((t) => ({
    id: t.id,
    inicio: t.inicio.toISOString(),
    fin: t.fin.toISOString(),
    estado: t.estado,
    modalidad: (t as any).modalidad ?? "presencial",
    cobrado: t.cobrado,
    confirmado: t.confirmado,
    importe: t.importe,
    notas: t.notas,
    meetLink: (t as any).meetLink ?? null,
    paciente: {
      id: t.paciente.id,
      nombre: t.paciente.nombre,
      apellido: t.paciente.apellido,
      tipo: t.paciente.tipo,
      obraSocialNombre: t.paciente.obraSocialNombre,
      tutorNombre: t.paciente.tutorNombre,
      tutorTelefono: t.paciente.tutorTelefono,
      tutorRelacion: t.paciente.tutorRelacion,
      fechaNacimiento: t.paciente.fechaNacimiento?.toISOString() ?? null,
      diagnostico: t.paciente.diagnostico,
    },
    sesion: t.sesion ? { id: t.sesion.id } : null,
  }));

  return (
    <div className="space-y-7">
      <FadeUp>
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg md:text-2xl font-semibold text-ink-800 leading-tight">
              {capitalize(hoyStr)}
            </h1>
            <p className="text-xs text-ink-400 mt-0.5">
              {saludo()}, {firstName}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <QuickNote pacientes={pacientesActivos} />
            <Link href="/calendario?nuevo=1" className="btn-ghost">
              <CalendarPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo turno</span>
            </Link>
            <Link href="/pacientes/nuevo" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo paciente</span>
            </Link>
          </div>
        </header>
      </FadeUp>

      {/* KPIs */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
        <StaggerItem className="h-full">
          <KpiCard
            icon={<CalendarDays className="w-4 h-4" />}
            label="Turnos hoy"
            value={turnosHoy.length.toString()}
            sub={
              proximoTurno
                ? `Próximo ${new Date(proximoTurno.inicio).toLocaleTimeString(
                    "es-AR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Argentina/Buenos_Aires",
                    }
                  )}`
                : "Sin turnos pendientes"
            }
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <KpiCard
            icon={<CircleDashed className="w-4 h-4" />}
            label="Pendiente de cobro"
            value={formatMoney(pendienteHoy)}
            sub={pendienteHoy > 0 ? "Marcá los turnos cobrados" : "Todo al día"}
            tone={pendienteHoy > 0 ? "warn" : "ok"}
          />
        </StaggerItem>
        <StaggerItem className="col-span-2 lg:col-span-1">
          <KpiCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Sesiones cargadas"
            value={
              turnosHoy.filter((t) => t.sesion).length +
              "/" +
              turnosHoy.length
            }
            sub={
              turnosHoy.filter((t) => t.estado === "realizado" && !t.sesion).length > 0
                ? "Hay turnos sin sesión ↓"
                : "De los turnos de hoy"
            }
            tone={turnosHoy.filter((t) => t.estado === "realizado" && !t.sesion).length > 0 ? "warn" : "default"}
            href="#agenda-semana"
          />
        </StaggerItem>
      </StaggerList>

      {/* Agenda semanal */}
      <FadeUp delay={0.15}>
        <section id="agenda-semana" className="space-y-3 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Agenda de la semana</h2>
            <Link
              href="/calendario"
              className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
            >
              Ver calendario <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {turnosSemana.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title="Semana libre"
              description="No tenés turnos programados esta semana."
              action={
                <Link href="/calendario" className="btn-ghost">
                  Ir al calendario
                </Link>
              }
            />
          ) : (
            <div className="space-y-6">
              <AgendaWeekWrapper
                initialTurnos={agendaTurnos}
                todayStr={todayStr}
                visibleDayKeys={visibleDayKeys}
              />
            </div>
          )}
        </section>
      </FadeUp>

      <FadeUp delay={0.22}>
        <DeudasClient
          initialTurnos={turnosSinCobrar.map((t) => ({
            id: t.id,
            inicio: t.inicio.toISOString(),
            estado: t.estado,
            importe: t.importe,
            paciente: {
              id: t.paciente.id,
              nombre: t.paciente.nombre,
              apellido: t.paciente.apellido,
              importeSesion: t.paciente.importeSesion,
            },
          }))}
          umbralDias={deudaDiasUmbral}
        />
      </FadeUp>

      {proximos.length > 0 && (
        <FadeUp delay={0.28}>
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Próximos turnos</h2>
              <Link
                href="/calendario"
                className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ProximosTurnos turnos={proximos} />
          </section>
        </FadeUp>
      )}
    </div>
  );
}

function ProximosTurnos({
  turnos,
}: {
  turnos: Array<{
    id: number;
    inicio: Date;
    paciente: { id: number; nombre: string; apellido: string; tipo: string; obraSocialNombre: string | null };
  }>;
}) {
  // Agrupar por día
  const byDay = new Map<string, typeof turnos>();
  for (const t of turnos.slice(0, 8)) {
    const key = t.inicio.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(t);
  }
  const dias = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-3">
      {dias.map(([dateKey, dTurnos]) => {
        const pivot = new Date(dateKey + "T12:00:00-03:00");
        const dayLabel = pivot.toLocaleDateString("es-AR", {
          weekday: "long", day: "numeric", month: "short",
          timeZone: "America/Argentina/Buenos_Aires",
        });
        return (
          <div key={dateKey}>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5 capitalize">
              {dayLabel}
            </p>
            <ul className="card divide-y divide-ink-100">
              {dTurnos.map((t) => (
                <li key={t.id} className="px-3 py-2.5 flex items-center gap-3 hover:bg-ink-50/50 transition">
                  <div className="w-10 shrink-0 text-center">
                    <p className="text-sm font-semibold tabular-nums text-ink-700">
                      {new Date(t.inicio).toLocaleTimeString("es-AR", {
                        hour: "2-digit", minute: "2-digit", hour12: false,
                        timeZone: "America/Argentina/Buenos_Aires",
                      })}
                    </p>
                  </div>
                  <Avatar nombre={t.paciente.nombre} apellido={t.paciente.apellido} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 truncate">
                      {t.paciente.apellido}, {t.paciente.nombre}
                    </p>
                    <span className={
                      "text-[11px] font-medium px-1.5 py-0.5 rounded-full " +
                      (t.paciente.tipo === "obra_social"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700")
                    }>
                      {t.paciente.tipo === "obra_social"
                        ? `OS · ${t.paciente.obraSocialNombre ?? "—"}`
                        : "Particular"}
                    </span>
                  </div>
                  <Link href={`/pacientes/${t.paciente.id}`} className="text-xs text-brand-700 hover:underline shrink-0">
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone = "default",
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "ok" | "warn";
  href?: string;
}) {
  const toneMap: Record<string, string> = {
    default: "bg-brand-50 text-brand-700",
    ok: "bg-sage-100 text-sage-700",
    warn: "bg-amber-100 text-amber-700",
  };
  // Mobile: horizontal (icono izquierda + datos derecha)
  // Desktop (lg): vertical clásico
  const inner = (
    <>
      {/* Mobile: fila horizontal */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl ${toneMap[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-ink-500 font-medium leading-none mb-0.5">
            {label}
          </p>
          <p className="text-lg font-semibold text-ink-800 tabular-nums leading-tight">
            {value}
          </p>
          {sub && (
            <p className="text-[11px] text-ink-400 leading-tight mt-0.5 truncate">
              {sub}
            </p>
          )}
        </div>
      </div>
      {/* Desktop: columna vertical */}
      <div className="hidden lg:block">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${toneMap[tone]}`}>
          {icon}
        </div>
        <p className="text-xs uppercase tracking-wider text-ink-500 mt-3">{label}</p>
        <p className="text-2xl font-semibold text-ink-800 tabular-nums mt-0.5">{value}</p>
        {sub && <p className="text-xs text-ink-500 mt-1">{sub}</p>}
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="card p-3 lg:p-4 h-full block hover:shadow-pop transition">
        {inner}
      </Link>
    );
  }
  return <div className="card p-3 lg:p-4 h-full">{inner}</div>;
}

