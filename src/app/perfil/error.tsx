"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción se podría enviar a un servicio de logging
    console.error("[Error global]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-500 mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-semibold text-ink-800 mb-2">
          Algo salió mal
        </h2>
        <p className="text-sm text-ink-500 mb-6">
          Ocurrió un error inesperado. Podés intentar recargar la página o volver al inicio.
          {error.digest && (
            <span className="block mt-2 text-xs text-ink-400 font-mono">
              Código: {error.digest}
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-ghost inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <Home className="w-4 h-4" /> Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
