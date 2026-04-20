"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HeartHandshake, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token || !email) {
    return (
      <div className="text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="text-ink-700 font-medium">Link inválido</p>
        <p className="text-sm text-ink-500">El link de recuperación es incorrecto o ya fue usado.</p>
        <Link href="/login" className="btn-primary inline-block">Ir al login</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-10 h-10 text-sage-600 mx-auto" />
        <p className="text-ink-700 font-semibold">¡Contraseña actualizada!</p>
        <p className="text-sm text-ink-500">Ya podés iniciar sesión con tu nueva contraseña.</p>
        <Link href="/login" className="btn-primary inline-block">Ir al login</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErr("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/reset-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al restablecer la contraseña");
      setDone(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-xs text-ink-500 mb-4">
          Ingresá tu nueva contraseña para <strong className="text-ink-700">{email}</strong>
        </p>
        <label className="label">Nueva contraseña</label>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            className="input pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition"
            onClick={() => setShowPwd((v) => !v)}
            tabIndex={-1}
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="label">Confirmar contraseña</label>
        <input
          type={showPwd ? "text" : "password"}
          className="input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repetí la contraseña"
          required
        />
      </div>
      {err && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {err}
        </p>
      )}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Guardando…" : "Restablecer contraseña"}
      </button>
      <p className="text-center text-xs text-ink-400">
        <Link href="/login" className="hover:underline">Volver al login</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-soft mb-4">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-ink-800">Nueva contraseña</h1>
          <p className="text-sm text-ink-500 mt-1">Lic. Candela Berardi · Gestión de Turnos</p>
        </div>
        <div className="card p-6">
          <Suspense fallback={<p className="text-sm text-ink-400 text-center">Cargando…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
