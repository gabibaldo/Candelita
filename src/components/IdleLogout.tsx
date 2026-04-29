"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, RefreshCw } from "lucide-react";

// 15 minutos sin actividad → mostrar aviso
const IDLE_MS = 15 * 60 * 1000;
// 5 minutos de aviso → cerrar sesión automáticamente (total 20 min)
const WARN_MS = 5 * 60 * 1000;

const EVENTS = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"] as const;

export default function IdleLogout() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARN_MS / 1000);
  const router = useRouter();

  const idleTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWarning  = useRef(false);

  function clearTimers() {
    if (idleTimer.current)  clearTimeout(idleTimer.current);
    if (warnTimer.current)  clearInterval(warnTimer.current);
  }

  async function doLogout() {
    clearTimers();
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function startWarnCountdown() {
    isWarning.current = true;
    setShowWarning(true);
    setSecondsLeft(WARN_MS / 1000);

    warnTimer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(warnTimer.current!);
          doLogout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function resetIdle() {
    // Si el aviso ya está visible, ignorar la actividad del usuario
    if (isWarning.current) return;
    clearTimers();
    idleTimer.current = setTimeout(startWarnCountdown, IDLE_MS);
  }

  function handleContinue() {
    clearTimers();
    isWarning.current = false;
    setShowWarning(false);
    setSecondsLeft(WARN_MS / 1000);
    resetIdle();
  }

  useEffect(() => {
    const handler = () => resetIdle();
    EVENTS.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetIdle(); // arrancar el timer inicial

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, handler));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!showWarning) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-5 animate-fadeUp">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7 text-amber-600" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink-900">¿Seguís ahí?</h2>
          <p className="text-sm text-ink-500 mt-1">
            Tu sesión se cerrará por inactividad en
          </p>
          <p className="text-3xl font-bold text-amber-600 tabular-nums mt-3">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={handleContinue} className="btn-primary w-full">
            <RefreshCw className="w-4 h-4" /> Seguir conectada
          </button>
          <button onClick={doLogout} className="btn-ghost w-full text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Cerrar sesión ahora
          </button>
        </div>
      </div>
    </div>
  );
}
