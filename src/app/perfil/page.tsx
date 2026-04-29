"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { User, CreditCard, Save, KeyRound, Calendar, CheckCircle2, XCircle, Download } from "lucide-react";

type Perfil = {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  titulo: string | null;
  matricula: string | null;
  especialidad: string | null;
  domicilioProfesional: string | null;
  cuit: string | null;
  razonSocial: string | null;
  condicionAfip: string | null;
  domicilioFiscal: string | null;
  cbu: string | null;
  aliasBank: string | null;
  googleAccessToken: string | null;
};

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 space-y-4">
      <h2 className="flex items-center gap-2 font-semibold text-brand-800">
        <span className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Datos personales / profesionales
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [titulo, setTitulo] = useState("");
  const [matricula, setMatricula] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [domicilioProfesional, setDomicilioProfesional] = useState("");

  // Datos de facturación
  const [cuit, setCuit] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [condicionAfip, setCondicionAfip] = useState("");
  const [domicilioFiscal, setDomicilioFiscal] = useState("");
  const [cbu, setCbu] = useState("");
  const [aliasBank, setAliasBank] = useState("");

  // Cambio de contraseña
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    fetch("/api/perfil")
      .then(async (r) => {
        if (!r.ok) {
          const msg = await r.json().catch(() => ({ error: `Error ${r.status}` }));
          throw new Error(typeof msg.error === "string" ? msg.error : `Error ${r.status}`);
        }
        return r.json() as Promise<Perfil>;
      })
      .then((p) => {
        setNombre(p.nombre ?? "");
        setEmail(p.email ?? "");
        setTelefono(p.telefono ?? "");
        setTitulo(p.titulo ?? "");
        setMatricula(p.matricula ?? "");
        setEspecialidad(p.especialidad ?? "");
        setDomicilioProfesional(p.domicilioProfesional ?? "");
        setCuit(p.cuit ?? "");
        setRazonSocial(p.razonSocial ?? "");
        setCondicionAfip(p.condicionAfip ?? "");
        setDomicilioFiscal(p.domicilioFiscal ?? "");
        setCbu(p.cbu ?? "");
        setAliasBank(p.aliasBank ?? "");
        setGoogleConnected(!!p.googleAccessToken);
      })
      .catch((e: Error) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    const g = searchParams.get("google");
    if (g === "ok") toast("Google Calendar conectado", "success");
    if (g === "error") toast("Error al conectar Google Calendar", "error");
  }, [searchParams, toast]);

  async function disconnectGoogle() {
    setDisconnecting(true);
    try {
      await fetch("/api/google/disconnect", { method: "POST" });
      setGoogleConnected(false);
      toast("Google Calendar desconectado", "success");
    } catch {
      toast("No se pudo desconectar", "error");
    } finally {
      setDisconnecting(false);
    }
  }

  async function saveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim() || null,
          email: email.trim() || null,
          telefono: telefono.trim() || null,
          titulo: titulo.trim() || null,
          matricula: matricula.trim() || null,
          especialidad: especialidad.trim() || null,
          domicilioProfesional: domicilioProfesional.trim() || null,
          cuit: cuit.trim() || null,
          razonSocial: razonSocial.trim() || null,
          condicionAfip: condicionAfip || null,
          domicilioFiscal: domicilioFiscal.trim() || null,
          cbu: cbu.trim() || null,
          aliasBank: aliasBank.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(typeof d.error === "string" ? d.error : "No se pudo guardar");
      }
      toast("Perfil actualizado", "success");
      router.refresh();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordNueva !== passwordConfirm) {
      toast("Las contraseñas no coinciden.", "error");
      return;
    }
    if (passwordNueva.length < 8) {
      toast("La contraseña debe tener al menos 8 caracteres.", "error");
      return;
    }
    setSavingPass(true);
    try {
      const res = await fetch("/api/perfil/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual: passwordActual, nueva: passwordNueva }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(typeof d.error === "string" ? d.error : "No se pudo cambiar");
      }
      toast("Contraseña actualizada", "success");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirm("");
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setSavingPass(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-10 text-center text-ink-400 text-sm animate-pulse">
        Cargando perfil…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Mi perfil</h1>
        <p className="text-sm text-ink-500 mt-1">
          Datos personales, profesionales y de facturación.
        </p>
      </header>

      <form onSubmit={saveGeneral} className="space-y-5">
        {/* Datos personales y de contacto */}
        <Section icon={<User className="w-4 h-4" />} title="Personal y profesional">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre completo *">
              <input
                className="input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </Field>
            <Field label="Email *">
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Teléfono">
              <input
                className="input"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="11 1234-5678"
              />
            </Field>
            <Field label="Título">
              <select
                className="input"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              >
                <option value="">— Sin especificar —</option>
                <option value="Lic.">Lic.</option>
                <option value="Mg.">Mg.</option>
                <option value="Dr.">Dr.</option>
                <option value="Dra.">Dra.</option>
                <option value="Prof.">Prof.</option>
              </select>
            </Field>
            <Field label="Matrícula profesional">
              <input
                className="input"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="MN / MP 12345"
              />
            </Field>
            <Field label="Especialidad">
              <input
                className="input"
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                placeholder="Psicología Infantil"
              />
            </Field>
          </div>
          <Field label="Domicilio profesional (consultorio)">
            <input
              className="input"
              value={domicilioProfesional}
              onChange={(e) => setDomicilioProfesional(e.target.value)}
              placeholder="Av. Corrientes 1234, Piso 3, Of. B — CABA"
            />
          </Field>
        </Section>

        {/* Datos de facturación */}
        <Section icon={<CreditCard className="w-4 h-4" />} title="Facturación y cobros">
          <p className="text-xs text-ink-500 bg-ink-50 rounded-lg px-3 py-2">
            Estos datos se usarán para generar facturas electrónicas y recibos de pago.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CUIT">
              <input
                className="input"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                placeholder="20-12345678-9"
              />
            </Field>
            <Field label="Razón social / Nombre fiscal">
              <input
                className="input"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Igual al nombre si sos monotributista"
              />
            </Field>
            <Field label="Condición AFIP">
              <select
                className="input"
                value={condicionAfip}
                onChange={(e) => setCondicionAfip(e.target.value)}
              >
                <option value="">— Sin especificar —</option>
                <option value="monotributista">Monotributista</option>
                <option value="responsable_inscripto">Responsable Inscripto</option>
                <option value="exento">Exento</option>
              </select>
            </Field>
            <Field label="Domicilio fiscal">
              <input
                className="input"
                value={domicilioFiscal}
                onChange={(e) => setDomicilioFiscal(e.target.value)}
                placeholder="Calle 1234, Ciudad"
              />
            </Field>
            <Field label="CBU">
              <input
                className="input font-mono text-sm"
                value={cbu}
                onChange={(e) => setCbu(e.target.value)}
                placeholder="0720123400000012345678"
                maxLength={22}
              />
            </Field>
            <Field label="Alias CBU">
              <input
                className="input"
                value={aliasBank}
                onChange={(e) => setAliasBank(e.target.value)}
                placeholder="cande.psi.mp"
              />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>

      {/* Google Calendar */}
      <Section icon={<Calendar className="w-4 h-4" />} title="Google Calendar">
        <p className="text-xs text-ink-500 bg-ink-50 rounded-lg px-3 py-2">
          Al conectar tu cuenta, los turnos virtuales crearán automáticamente un evento en Google Calendar con link de Google Meet.
        </p>
        {googleConnected ? (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              Cuenta conectada
            </span>
            <button
              type="button"
              className="btn-ghost text-red-600 hover:bg-red-50"
              onClick={disconnectGoogle}
              disabled={disconnecting}
            >
              <XCircle className="w-4 h-4" />
              {disconnecting ? "Desconectando…" : "Desconectar"}
            </button>
          </div>
        ) : (
          <a href="/api/google/auth" className="btn-primary inline-flex w-fit">
            <Calendar className="w-4 h-4" />
            Conectar Google Calendar
          </a>
        )}
      </Section>

      {/* Cambio de contraseña */}
      <Section icon={<KeyRound className="w-4 h-4" />} title="Cambiar contraseña">
        <form onSubmit={savePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Contraseña actual">
              <input
                type="password"
                className="input"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            <Field label="Nueva contraseña">
              <input
                type="password"
                className="input"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmar nueva">
              <input
                type="password"
                className="input"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-ghost"
              disabled={savingPass || !passwordActual || !passwordNueva}
            >
              <KeyRound className="w-4 h-4" />
              {savingPass ? "Cambiando…" : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </Section>

      <Section icon={<Download className="w-5 h-5" />} title="Exportar datos">
        <p className="text-sm text-ink-500 mb-4">
          Descargá un backup completo de tus pacientes, turnos y sesiones en formato JSON.
        </p>
        <a
          href="/api/exportar"
          download
          className="btn-ghost inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Descargar backup
        </a>
      </Section>
    </div>
  );
}
