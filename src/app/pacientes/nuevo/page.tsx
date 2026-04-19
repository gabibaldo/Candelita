import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PatientForm from "@/components/PatientForm";

export default function NuevoPacientePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/pacientes" className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-brand-800">Nuevo paciente</h1>
      </div>
      <PatientForm />
    </div>
  );
}
