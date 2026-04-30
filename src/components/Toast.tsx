"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";

type ToastKind = "success" | "error" | "info" | "warn";
type Toast = { id: number; kind: ToastKind; msg: string };

type ConfirmOpts = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Ctx = {
  toast: (msg: string, kind?: ToastKind) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx)
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<
    (ConfirmOpts & { resolve: (v: boolean) => void }) | null
  >(null);
  const idRef = useRef(1);

  const toast = useCallback((msg: string, kind: ToastKind = "info") => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOpts) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ ...opts, resolve });
      }),
    []
  );

  function resolveConfirm(result: boolean) {
    confirmState?.resolve(result);
    setConfirmState(null);
  }

  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") resolveConfirm(false);
      if (e.key === "Enter") resolveConfirm(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState]);

  return (
    <ToastCtx.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fadeUp flex items-start gap-3 card px-4 py-3 shadow-pop"
            role="status"
          >
            {t.kind === "success" && (
              <CheckCircle2 className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
            )}
            {t.kind === "error" && (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            {t.kind === "info" && (
              <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            )}
            {t.kind === "warn" && (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-ink-800">{t.msg}</p>
            <button
              onClick={() =>
                setToasts((all) => all.filter((x) => x.id !== t.id))
              }
              className="text-ink-400 hover:text-ink-600 ml-auto"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[110] bg-ink-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeUp"
          onClick={() => resolveConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card max-w-md w-full p-6 space-y-4"
          >
            <div className="flex gap-3 items-start">
              <div
                className={
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 " +
                  (confirmState.destructive
                    ? "bg-red-100 text-red-600"
                    : "bg-brand-100 text-brand-700")
                }
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-ink-800">
                  {confirmState.title}
                </h3>
                {confirmState.description && (
                  <p className="text-sm text-ink-600 mt-1">
                    {confirmState.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => resolveConfirm(false)}
                className="btn-ghost"
              >
                {confirmState.cancelLabel ?? "Cancelar"}
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className={
                  confirmState.destructive ? "btn-danger" : "btn-primary"
                }
                autoFocus
              >
                {confirmState.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}
