"use client";
import dynamic from "next/dynamic";
import type { TurnoAgenda } from "./AgendaWeekClient";

const AgendaWeekClient = dynamic(() => import("./AgendaWeekClient"), {
  ssr: false,
  loading: () => (
    <div className="card p-8 text-center text-ink-400 text-sm animate-pulse">
      Cargando agenda…
    </div>
  ),
});

export default function AgendaWeekWrapper(props: {
  initialTurnos: TurnoAgenda[];
  todayStr: string;
  visibleDayKeys: string[];
}) {
  return <AgendaWeekClient {...props} />;
}
