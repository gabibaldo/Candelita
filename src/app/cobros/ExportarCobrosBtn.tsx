"use client";
import { Download } from "lucide-react";

export default function ExportarCobrosBtn({ year, month }: { year: number; month: number }) {
  function descargar() {
    window.location.href = `/api/exportar/cobros?year=${year}&month=${month}`;
  }

  const nombreMes = new Date(year, month - 1, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <button onClick={descargar} className="btn-ghost text-sm">
      <Download className="w-4 h-4" />
      Exportar {nombreMes}
    </button>
  );
}
