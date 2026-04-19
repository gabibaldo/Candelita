"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HeartHandshake,
  Lock,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  FileText,
  Users,
} from "lucide-react";

const REMEMBER_KEY = "candelita_remember_email";

// ─── Formulario de login ────────────────────────────────────────────────────
function LoginForm({ onRecover }: { onRecover: () => void }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";

  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REMEMBER_KEY) ?? "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(REMEMBER_KEY);
    }
    return false;
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Email o contraseña incorrectos.");
      }
      // Guardar email si está marcado "recordar"
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      router.push(next);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[360px] space-y-6 animate-fadeUp">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2 mb-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white shadow-lg">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-ink-800 text-sm">Lic. Candela Berardi</p>
          <p className="text-[11px] text-ink-400">Psicóloga Infantil</p>
        </div>
      </div>

      {/* Encabezado */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-ink-900">Bienvenida</h2>
        <p className="text-sm text-ink-500">Ingresá para acceder a tu consultorio.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" autoComplete="on">
        {/* Email */}
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="input pl-9"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="cande@consultorio.com"
              required
            />
          </div>
        </div>

        {/* Contraseña */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0">Contraseña</label>
            <button
              type="button"
              onClick={onRecover}
              className="text-xs text-brand-600 hover:text-brand-700 hover:underline transition"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="input pl-9 pr-10"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition"
              tabIndex={-1}
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Recordar */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <div className="w-4 h-4 rounded border border-ink-300 bg-white peer-checked:bg-brand-600 peer-checked:border-brand-600 transition flex items-center justify-center">
              {remember && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-ink-600 group-hover:text-ink-800 transition">
            Recordar mi email
          </span>
        </label>

        {/* Error */}
        {err && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            <span className="mt-0.5 shrink-0">⚠</span>
            {err}
          </div>
        )}

        <button className="btn-primary w-full py-2.5" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Entrando…</>
          ) : (
            "Ingresar"
          )}
        </button>
      </form>

      <p className="text-center text-[11px] text-ink-400 leading-relaxed">
        Información confidencial. El acceso está restringido a personal autorizado.
      </p>
    </div>
  );
}

// ─── Formulario de recuperación ─────────────────────────────────────────────
function RecoverForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulamos el envío (sin backend por ahora)
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  }

  if (sent) {
    return (
      <div className="w-full max-w-[360px] space-y-6 animate-fadeUp text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-sage-100 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-sage-600" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-ink-900">Revisá tu correo</h2>
          <p className="text-sm text-ink-500 leading-relaxed">
            Si <span className="font-medium text-ink-700">{email}</span> está registrado,
            vas a recibir un correo con el link para restablecer tu contraseña en los
            próximos minutos.
          </p>
        </div>
        <button onClick={onBack} className="btn-ghost w-full">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
        </button>
        <p className="text-[11px] text-ink-400">
          ¿No llegó? Revisá la carpeta de spam o escribinos.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px] space-y-6 animate-fadeUp">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-ink-900">Recuperar contraseña</h2>
        <p className="text-sm text-ink-500">
          Ingresá tu email y te enviamos un link para crear una nueva contraseña.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Email registrado</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="input pl-9"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cande@consultorio.com"
              required
              autoFocus
            />
          </div>
        </div>

        <button className="btn-primary w-full py-2.5" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
          ) : (
            "Enviar link de recuperación"
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Panel lateral decorativo ────────────────────────────────────────────────
function DecorativePanel() {
  const features = [
    { icon: Calendar, text: "Agenda de turnos con vista semanal" },
    { icon: Users, text: "Historial de pacientes y tutores" },
    { icon: FileText, text: "Sesiones clínicas con notas y seguimiento" },
  ];

  return (
    <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      {/* Logo / marca */}
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-[13px]">Lic. Candela Berardi</p>
          <p className="text-[11px] text-white/60">Psicóloga Infantil</p>
        </div>
      </div>

      {/* Contenido central */}
      <div className="relative space-y-8">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
            Gestión de Turnos
          </p>
          <h1 className="text-3xl font-bold leading-tight">
            Tu consultorio,<br />
            en un solo lugar.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Organizá tus sesiones, seguí el progreso de cada paciente
            y tené todo a mano cuando lo necesitás.
          </p>
        </div>

        <ul className="space-y-3">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-white/80">
              <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <p className="relative text-xs text-white/40">
        © {new Date().getFullYear()} · Hecho con cariño
      </p>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
function LoginContent() {
  const [view, setView] = useState<"login" | "recover">("login");

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <DecorativePanel />

      {/* Panel de formulario */}
      <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-gradient-to-b from-brand-50 to-white md:bg-none md:bg-white">
        <Suspense
          fallback={
            <div className="text-sm text-ink-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          }
        >
          {view === "login" ? (
            <LoginForm onRecover={() => setView("recover")} />
          ) : (
            <RecoverForm onBack={() => setView("login")} />
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-ink-400" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
