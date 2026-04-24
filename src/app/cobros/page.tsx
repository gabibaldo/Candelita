import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { Banknote, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import CobrosClient from "./CobrosClient";

export const dynamic = "force-dynamic";

function arDateStr(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

export default async function CobrosPage() {
  const todayStr = arDateStr();
  const [year, month] = todayStr.split("-").map(Number);
  const inicioMes = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`);
  const hace30 = new Date(Date.now() - 30 * 86_400_000);
  const hace7 = new Date(Date.now() - 7 * 86_400_000);

  const [pendientes, cobradosMes] = await Promise.all([
    prisma.turno.findMany({
      where: { cobrado: false, estado: { in: ["realizado", "programado"] } },
      orderBy: { inicio: "desc" },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true, importeSesion: true } },
      },
    }),
    prisma.turno.findMany({
      where: { cobrado: true, estado: "realizado", inicio: { gte: inicioMes } },
      include: { paciente: { select: { importeSesion: true } } },
    }),
  ]);

  const totalPendiente = pendientes.reduce(
    (a, t) => a + (t.importe ?? t.paciente.importeSesion), 0
  );
  const totalCobradoMes = cobradosMes.reduce(
    (a, t) => a + (t.importe ?? t.paciente.importeSesion), 0
  );
  const pendienteViejos = pendientes.filter((t) => new Date(t.inicio) < hace30);
  const totalViejos = pendienteViejos.reduce(
    (a, t) => a + (t.importe ?? t.paciente.importeSesion), 0
  );
  const pendienteReciente = pendientes.filter(
    (t) => new Date(t.inicio) >= hace7
  ).reduce((a, t) => a + (t.importe ?? t.paciente.importeSesion), 0);

  const turnosParaCliente = pendientes.map((t) => ({
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
  }));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-ink-500">Finanzas</p>
        <h1 className="text-2xl font-semibold text-ink-800">Cobros</h1>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Banknote className="w-4 h-4" />}
          label="Total pendiente"
          value={formatMoney(totalPendiente)}
          sub={`${pendientes.length} turno${pendientes.length !== 1 ? "s" : ""}`}
          tone={totalPendiente > 0 ? "warn" : "ok"}
        />
        <KpiCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Cobrado este mes"
          value={formatMoney(totalCobradoMes)}
          sub={`${cobradosMes.length} sesione${cobradosMes.length !== 1 ? "s" : ""}`}
          tone="ok"
        />
        <KpiCard
          icon={<Clock className="w-4 h-4" />}
          label="Últimos 7 días"
          value={formatMoney(pendienteReciente)}
          sub="pendiente reciente"
          tone="default"
        />
        <KpiCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Más de 30 días"
          value={formatMoney(totalViejos)}
          sub={`${pendienteViejos.length} turno${pendienteViejos.length !== 1 ? "s" : ""} vencidos`}
          tone={totalViejos > 0 ? "danger" : "ok"}
        />
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Turnos sin cobrar</h2>
        <CobrosClient turnos={turnosParaCliente} />
      </section>
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
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  const toneMap: Record<string, string> = {
    default: "bg-brand-50 text-brand-700",
    ok: "bg-sage-100 text-sage-700",
    warn: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-600",
  };
  return (
    <div className="card p-4">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${toneMap[tone]}`}>
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wider text-ink-500 mt-3">{label}</p>
      <p className="text-xl md:text-2xl font-semibold text-ink-800 tabular-nums mt-0.5">{value}</p>
      {sub && <p className="text-xs text-ink-500 mt-1">{sub}</p>}
    </div>
  );
}
