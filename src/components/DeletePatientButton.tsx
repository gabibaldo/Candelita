"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePatientButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (
      !confirm(
        "¿Marcar paciente como inactivo? La historia clínica se conserva."
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/pacientes/${id}`, { method: "DELETE" });
      router.push("/pacientes");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={run} className="btn-danger" disabled={loading}>
      {loading ? "…" : "Desactivar"}
    </button>
  );
}
