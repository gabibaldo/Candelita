"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePatientButton({ id, activo = true }: { id: number; activo?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (activo) {
      if (!confirm("¿Marcar paciente como inactivo? La historia clínica se conserva.")) return;
      setLoading(true);
      await fetch(`/api/pacientes/${id}`, { method: "DELETE" });
      router.refresh();
    } else {
      if (!confirm("¿Reactivar este paciente?")) return;
      setLoading(true);
      await fetch(`/api/pacientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: true }),
      });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <button
      onClick={run}
      className={activo ? "btn-danger" : "btn-ghost"}
      disabled={loading}
    >
      {loading ? "…" : activo ? "Desactivar" : "Reactivar"}
    </button>
  );
}
