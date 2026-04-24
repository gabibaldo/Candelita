"use client";
import { Suspense, useState } from "react";
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
} from "lucide-react";

const REMEMBER_KEY = "candelita_remember_email";

// ─── Input glass ────────────────────────────────────────────────────────────
function GlassInput({ icon: Icon, ...props }: { icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        {...props}
        className={
          "w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 " +
          "rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition " +
          "focus:bg-white/15 focus:border-white/40 focus:ring-2 focus:ring-white/10 " +
          (props.className ?? "")
        }
      />
    </div>
  );
}

// ─── Formulario de login ─────────────────────────────────────────────────────
function LoginForm({ onRecover }: { onRecover: () => void }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";

  const [email, setEmail] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem(REMEMBER_KEY) ?? "") : ""
  );
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(() =>
    typeof window !== "undefined" ? !!localStorage.getItem(REMEMBER_KEY) : false
  );
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
    <div className="w-full max-w-[380px] space-y-6 animate-fadeUp">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center shadow-lg">
          <HeartHandshake className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-white text-sm">Lic. Candela Berardi</p>
          <p className="text-[11px] text-white/50">Psicóloga Infantil</p>
        </div>
      </div>

      {/* Card de cristal */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-7 shadow-2xl space-y-5">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-white">Bienvenida</h2>
          <p className="text-sm text-white/50">Ingresá para acceder a tu consultorio.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" autoComplete="on">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Email</label>
            <GlassInput
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="cande@consultorio.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Contraseña</label>
              <button
                type="button"
                onClick={onRecover}
                className="text-xs text-white/50 hover:text-white transition"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <GlassInput
                icon={Lock}
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition"
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
              <div className="w-4 h-4 rounded border border-white/30 bg-white/10 peer-checked:bg-brand-500 peer-checked:border-brand-400 transition flex items-center justify-center">
                <svg
                  className={"w-2.5 h-2.5 text-white transition-opacity " + (remember ? "opacity-100" : "opacity-0")}
                  viewBox="0 0 10 8" fill="none" aria-hidden="true"
                >
                  <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <span className="text-sm text-white/50 group-hover:text-white/80 transition">
              Recordar mi email
            </span>
          </label>

          {err && (
            <div className="flex items-start gap-2 text-sm text-red-200 bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2.5">
              <span className="mt-0.5 shrink-0">⚠</span>
              {err}
            </div>
          )}

          <button
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-sm font-semibold transition shadow-lg shadow-brand-900/30 disabled:opacity-60 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Entrando…</>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-white/30 leading-relaxed">
        Información confidencial. El acceso está restringido a personal autorizado.
      </p>
    </div>
  );
}

// ─── Formulario de recuperación ──────────────────────────────────────────────
function RecoverForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-[380px] animate-fadeUp">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-7 shadow-2xl space-y-5 text-center">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-300" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Revisá tu correo</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Si <span className="font-medium text-white/80">{email}</span> está registrado,
              vas a recibir un link para restablecer tu contraseña.
            </p>
          </div>
          <button onClick={onBack} className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] animate-fadeUp">
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-7 shadow-2xl space-y-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-white">Recuperar contraseña</h2>
          <p className="text-sm text-white/50">
            Ingresá tu email y te enviamos un link para crear una nueva contraseña.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Email registrado</label>
            <GlassInput
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cande@consultorio.com"
              required
              autoFocus
            />
          </div>

          <button
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition shadow-lg shadow-brand-900/30 disabled:opacity-60 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
            ) : (
              "Enviar link de recuperación"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
function LoginContent() {
  const [view, setView] = useState<"login" | "recover">("login");

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 relative overflow-hidden bg-gradient-to-br from-[#1a0533] via-brand-900 to-[#0d1a4a]">
      {/* Orbs decorativos */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand-600/40 blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-700/30 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[120px]" />
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <Suspense
        fallback={
          <div className="text-sm text-white/40 flex items-center gap-2">
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
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0533] via-brand-900 to-[#0d1a4a]">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
