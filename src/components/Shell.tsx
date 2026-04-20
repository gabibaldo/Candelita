"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  LogOut,
  HeartHandshake,
  UserCircle,
  BarChart3,
} from "lucide-react";
import { useToast } from "./Toast";
import SidebarWidget from "./SidebarWidget";

const links = [
  { href: "/", label: "Hoy", icon: LayoutDashboard },
  { href: "/calendario", label: "Calendario", icon: CalendarIcon },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/perfil", label: "Perfil", icon: UserCircle },
];

export default function Shell({
  nombre,
  children,
}: {
  nombre: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { confirm, toast } = useToast();

  async function logout() {
    const ok = await confirm({
      title: "¿Cerrar sesión?",
      description: "Vas a volver a la pantalla de ingreso.",
      confirmLabel: "Salir",
    });
    if (!ok) return;
    await fetch("/api/logout", { method: "POST" });
    toast("Sesión cerrada", "info");
    router.push("/login");
    router.refresh();
  }

  const firstName = nombre.split(" ")[0];

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col sticky top-0 h-screen border-r border-ink-100 bg-white px-3 py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 mb-5 rounded-xl hover:bg-brand-50 transition">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white shadow-soft shrink-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-semibold text-ink-800 text-sm truncate">Lic. Candela Berardi</p>
            <p className="text-xs text-ink-400">Psicóloga Infantil</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-800"
                )}
              >
                <Icon
                  className={clsx(
                    "w-[17px] h-[17px] shrink-0",
                    active ? "text-brand-600" : "text-ink-400"
                  )}
                />
                {l.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Widget hoy */}
        <SidebarWidget />

        {/* User footer */}
        <div className="pt-3 border-t border-ink-100">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-ink-50 transition">
            <Link
              href="/perfil"
              className="avatar w-8 h-8 bg-brand-100 text-brand-700 hover:bg-brand-200 transition shrink-0"
              title="Ver perfil"
            >
              {firstName.slice(0, 2).toUpperCase()}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href="/perfil" className="text-sm font-semibold text-ink-800 truncate hover:text-brand-700 transition block">
                {firstName}
              </Link>
              <p className="text-xs text-ink-400 truncate">Conectada</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Topbar mobile */}
      <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-ink-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white shrink-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <p className="font-semibold text-ink-800 text-sm">Lic. Candela Berardi</p>
          <button onClick={logout} className="ml-auto p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 md:px-8 py-5 md:py-8 pb-24 md:pb-10 max-w-5xl w-full">
        {children}
      </main>

      {/* Bottom tabs mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-ink-100 px-3 pt-1.5 pb-2 flex items-stretch justify-around safe-bottom">
        {links.map((l) => {
          const Icon = l.icon;
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "flex-1 flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all",
                active
                  ? "text-brand-700 bg-brand-50"
                  : "text-ink-400 hover:text-ink-600"
              )}
            >
              <Icon className={clsx("w-5 h-5", active ? "text-brand-600" : "text-ink-400")} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
