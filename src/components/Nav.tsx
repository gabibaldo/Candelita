"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/", label: "Hoy" },
  { href: "/calendario", label: "Calendario" },
  { href: "/pacientes", label: "Pacientes" },
];

export default function Nav({ nombre }: { nombre: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-semibold text-brand-800">Candelita</span>
        </Link>
        <nav className="flex gap-1 ml-4">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition",
                  active
                    ? "bg-brand-100 text-brand-800"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-gray-600">
          <span className="hidden sm:inline">Hola, {nombre.split(" ")[0]}</span>
          <button onClick={logout} className="btn-ghost">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
