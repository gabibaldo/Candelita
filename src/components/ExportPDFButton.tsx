"use client";
import { useState } from "react";

export default function ExportPDFButton({ pacienteId }: { pacienteId: number }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [open, setOpen] = useState(false);

  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const href = `/api/historia/${pacienteId}/pdf${params.toString() ? "?" + params.toString() : ""}`;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost">
        Exportar PDF
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-ink-200 rounded-xl shadow-lg p-4 space-y-3 w-64">
            <p className="text-xs font-semibold text-ink-600">Período del PDF</p>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-ink-500 block mb-0.5">Desde</label>
                <input
                  type="date"
                  className="input text-sm h-8"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-500 block mb-0.5">Hasta</label>
                <input
                  type="date"
                  className="input text-sm h-8"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[10px] text-ink-400">Vacío = exporta toda la historia.</p>
            <a
              href={href}
              target="_blank"
              className="btn-primary w-full text-center text-sm block"
              onClick={() => setOpen(false)}
            >
              Descargar PDF →
            </a>
          </div>
        </>
      )}
    </div>
  );
}
