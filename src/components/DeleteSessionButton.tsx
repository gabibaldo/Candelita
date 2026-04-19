"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function DeleteSessionButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { confirm } = useToast();

  async function run() {
    const ok = await confirm({
      title: "¿Eliminar esta sesión?",
      description: "Se eliminará de la historia clínica. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setLoading(true);
    try {
      await fetch(`/api/sesiones/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={run}
      className="text-xs text-red-600 hover:underline"
      disabled={loading}
    >
      {loading ? "…" : "eliminar"}
    </button>
  );
}
