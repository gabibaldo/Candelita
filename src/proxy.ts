import { NextRequest, NextResponse } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/reset-password",
  "/api/auth/reset-request",
  "/api/auth/reset-confirm",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifyToken(token);

  // Si ya está autenticada y va a /login → redirigir al inicio
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Rutas públicas: dejar pasar sin verificar
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Sin sesión → redirigir a login (páginas) o 401 (API)
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todas las rutas salvo assets estáticos y _next internals
    "/((?!_next/|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js)).*)",
  ],
};
