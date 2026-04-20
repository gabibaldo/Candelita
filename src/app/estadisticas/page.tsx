import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  CalendarCheck,
  Banknote,
  Monitor,
  Building2,
  UserCheck,
  UserX,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── helpers de zona horaria ─────────────────────────────────────────────────

function arDateStr(d = new Date()) {
  return d.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function startOfMonthAR(year: number, month: number) {
  // month: 0-indexed
  const mm = String(month + 1).padStart(2, "0");
  return new Date(`${year}-${mm}-01T00:00:00-03:00`);
}

function endOfMonthAR(year: number, month: number) {
  const first = startOfMonthAR(year, month);
  // primer día del mes siguiente menos 1ms
  const next = new Date(first);
  next.setMonth(next.getMonth() + 1);
  return new Date(next.getTime() - 1);
}

function monthLabel(year: number, month: number) {
  const d = startOfMonthAR(year, month);
  return d.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

// ─── página ──────────────────────────────────────────────────────────────────

export default async function EstadisticasPage() {
  const todayStr = arDateStr();
  const [todayYear, todayMonth] = todayStr.split("-").map(Number);

  // Últimos 6 meses (mes actual incluido)
  const meses = Array.from({ length: 6 }, (_, i) => {
    let m = todayMonth - 1 - (5 - i); // 0-indexed, oldest first
    let y = todayYear;
    while (m < 0) { m += 12; y -= 1; }
    return { year: y, month: m };
  });

  const rangeStart = startOfMonthAR(meses[0].year, meses[0].month);
  const rangeEnd   = endOfMonthAR(meses[5].year, meses[5].month);

  const [turnosRango, pacientesActivos, turnosTotales] = await Promise.all([
    prisma.turno.findMany({
      where: { inicio: { gte: rangeStart, lte: rangeEnd } },
      include: {
        paciente: { select: { importeSesion: true } },
      },
      orderBy: { inicio: "asc" },
    }),
    prisma.paciente.count({ where: { activo: true } }),
    prisma.turno.count(),
  ]);

  // ── Agrupar por mes ────────────────────────────────────────────────────────
  type MesData = {
    label: string;
    realizados: number;
    cancelados: number;
    ausentes: number;
    programados: number;
    ingresos: number;
    presencial: number;
    virtual: number;
  };

  const byMes = new Map<string, MesData>();

  for (const { year, month } of meses) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    byMes.set(key, {
      label: monthLabel(year, month),
      realizados: 0,
      cancelados: 0,
      ausentes: 0,
      programados: 0,
      ingresos: 0,
      presencial: 0,
      virtual: 0,
    });
  }

  for (const t of turnosRango) {
    const tStr = new Date(t.inicio).toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const key = tStr.slice(0, 7); // "YYYY-MM"
    const mes = byMes.get(key);
    if (!mes) continue;

    if (t.estado === "realizado") {
      mes.realizados++;
      if (t.cobrado) {
        mes.ingresos += t.importe ?? t.paciente.importeSesion ?? 0;
      }
    } else if (t.estado === "cancelado") {
      mes.cancelados++;
    } else if (t.estado === "ausente") {
      mes.ausentes++;
    } else {
      mes.programados++;
    }

    if (t.modalidad === "virtual") mes.virtual++;
    else mes.presencial++;
  }

  const mesesArr = Array.from(byMes.values()).reverse(); // más reciente primero

  // ── Totales globales del rango ─────────────────────────────────────────────
  const totalRealizados   = turnosRango.filter((t) => t.estado === "realizado").length;
  const totalCancelados   = turnosRango.filter((t) => t.estado === "cancelado").length;
  const totalAusentes     = turnosRango.filter((t) => t.estado === "ausente").length;
  const totalIngresos     = turnosRango
    .filter((t) => t.estado === "realizado" && t.cobrado)
    .reduce((acc, t) => acc + (t.importe ?? t.paciente.importeSesion ?? 0), 0);
  const totalVirtual      = turnosRango.filter((t) => t.modalidad === "virtual").length;
  const totalPresencial   = turnosRango.filter((t) => t.modalidad === "presencial").length;
  const tasaAsistencia    = totalRealizados + totalAusentes > 0
    ? Math.round((totalRealizados / (totalRealizados + totalAusentes)) * 100)
    : null;

  // ── Mejor mes ─────────────────────────────────────────────────────────────
  const maxIngresos = Math.max(...mesesArr.map((m) => m.ingresos), 1);
  const mejorMes = mesesArr.reduce(
    (best, m) => (m.ingresos > (best?.ingresos ?? -1) ? m : best),
    null as MesData | null
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-ink-500">Resumen</p>
        <h1 className="text-2xl font-semibold text-ink-800">Estadísticas</h1>
        <p className="text-xs text-ink-400 mt-0.5">Últimos 6 meses</p>
      </header>

      {/* KPIs globales */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<CalendarCheck className="w-4 h-4" />}
          label="Sesiones realizadas"
          value={totalRealizados.toString()}
          sub="en los últimos 6 meses"
          tone="default"
        />
        <KpiCard
          icon={<Banknote className="w-4 h-4" />}
          label="Ingresos cobrados"
          value={formatMoney(totalIngresos)}
          sub="turnos cobrados realizados"
          tone="ok"
        />
        <KpiCard
          icon={<Users className="w-4 h-4" />}
          label="Pacientes activos"
          value={pacientesActivos.toString()}
          sub={`${turnosTotales} turnos en total`}
          tone="default"
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Tasa de asistencia"
          value={tasaAsistencia != null ? `${tasaAsistencia}%` : "—"}
          sub={`${totalAusentes} ausencias · ${totalCancelados} cancelaciones`}
          tone={
            tasaAsistencia == null
              ? "default"
              : tasaAsistencia >= 80
              ? "ok"
              : "warn"
          }
        />
      </section>

      {/* Mejor mes */}
      {mejorMes && mejorMes.ingresos > 0 && (
        <section className="card p-4 flex items-center gap-4 bg-gradient-to-r from-brand-50 to-white border-brand-100">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-brand-500 font-medium">Mejor mes</p>
            <p className="text-base font-semibold text-ink-800 capitalize">{mejorMes.label}</p>
            <p className="text-xs text-ink-500">
              {formatMoney(mejorMes.ingresos)} cobrados · {mejorMes.realizados} sesiones
            </p>
          </div>
        </section>
      )}

      {/* Modalidad */}
      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-500">Presencial</p>
            <p className="text-2xl font-semibold text-ink-800 tabular-nums">{totalPresencial}</p>
            <p className="text-xs text-ink-400">turnos</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-500">Virtual</p>
            <p className="text-2xl font-semibold text-ink-800 tabular-nums">{totalVirtual}</p>
            <p className="text-xs text-ink-400">turnos</p>
          </div>
        </div>
      </section>

      {/* Tabla mensual */}
      <section className="space-y-3">
        <h2 className="section-title">Detalle por mes</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-500 uppercase tracking-wider">Mes</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-ink-500 uppercase tracking-wider">Realizadas</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-ink-500 uppercase tracking-wider hidden sm:table-cell">Ausencias</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-ink-500 uppercase tracking-wider hidden sm:table-cell">Canceladas</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-ink-500 uppercase tracking-wider">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {mesesArr.map((mes) => {
                const total = mes.realizados + mes.ausentes + mes.cancelados + mes.programados;
                return (
                  <tr key={mes.label} className="hover:bg-ink-50/40 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-800 capitalize">{mes.label}</p>
                      <p className="text-xs text-ink-400">{total} turno{total !== 1 ? "s" : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-ink-800 tabular-nums">{mes.realizados}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className={mes.ausentes > 0 ? "text-amber-600 font-medium" : "text-ink-400"}>
                        {mes.ausentes > 0 ? mes.ausentes : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className={mes.cancelados > 0 ? "text-red-500 font-medium" : "text-ink-400"}>
                        {mes.cancelados > 0 ? mes.cancelados : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-sage-700 tabular-nums">
                        {mes.ingresos > 0 ? formatMoney(mes.ingresos) : <span className="text-ink-300">—</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gráficos lado a lado en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barra de ingresos */}
        <section className="space-y-3">
          <h2 className="section-title">Ingresos cobrados por mes</h2>
          <div className="card p-5 space-y-3">
            {mesesArr.map((mes) => {
              const pct = maxIngresos > 0 ? (mes.ingresos / maxIngresos) * 100 : 0;
              return (
                <div key={mes.label} className="flex items-center gap-3">
                  <p className="text-xs text-ink-500 capitalize w-28 shrink-0 truncate">{mes.label}</p>
                  <div className="flex-1 h-6 bg-ink-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-ink-700 tabular-nums w-24 text-right shrink-0">
                    {mes.ingresos > 0 ? formatMoney(mes.ingresos) : <span className="text-ink-300">—</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Asistencia */}
        <section className="space-y-3">
          <h2 className="section-title">Asistencia por mes</h2>
          <div className="card p-5 space-y-3">
            {mesesArr.map((mes) => {
              const total = mes.realizados + mes.ausentes;
              const pct = total > 0 ? Math.round((mes.realizados / total) * 100) : null;
              return (
                <div key={mes.label} className="flex items-center gap-3">
                  <p className="text-xs text-ink-500 capitalize w-28 shrink-0 truncate">{mes.label}</p>
                  <div className="flex-1 h-6 bg-ink-100 rounded-full overflow-hidden relative">
                    {pct != null && (
                      <div
                        className={
                          "h-full rounded-full transition-all duration-500 " +
                          (pct >= 80
                            ? "bg-gradient-to-r from-sage-400 to-sage-600"
                            : "bg-gradient-to-r from-amber-300 to-amber-500")
                        }
                        style={{ width: `${pct}%` }}
                      />
                    )}
                  </div>
                  <div className="w-20 text-right shrink-0 flex items-center justify-end gap-1.5">
                    {pct != null ? (
                      <>
                        <UserCheck className="w-3 h-3 text-sage-600" />
                        <span className="text-xs font-semibold text-ink-700 tabular-nums">{pct}%</span>
                      </>
                    ) : (
                      <span className="text-xs text-ink-300">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "ok" | "warn";
}) {
  const toneMap: Record<string, string> = {
    default: "bg-brand-50 text-brand-700",
    ok: "bg-sage-100 text-sage-700",
    warn: "bg-amber-100 text-amber-700",
  };
  return (
    <div className="card p-4">
      <div className={"inline-flex items-center justify-center w-8 h-8 rounded-lg " + toneMap[tone]}>
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wider text-ink-500 mt-3">{label}</p>
      <p className="text-xl md:text-2xl font-semibold text-ink-800 tabular-nums mt-0.5">{value}</p>
      {sub && <p className="text-xs text-ink-500 mt-1">{sub}</p>}
    </div>
  );
}
