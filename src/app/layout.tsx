import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";
import { ToastProvider } from "@/components/Toast";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Lic. Candela Berardi · Psicóloga Infantil",
  description: "Gestión de pacientes, turnos e historias clínicas",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased bg-[var(--bg)] text-ink-800">
        <ToastProvider>
          {session ? (
            <Shell nombre={session.nombre}>{children}</Shell>
          ) : (
            <main className="min-h-screen">{children}</main>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
