import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("google_oauth_state")?.value;

  const errorRes = NextResponse.redirect(new URL("/perfil?google=error", req.url));
  errorRes.cookies.delete("google_oauth_state");

  if (!state || !savedState || state !== savedState) return errorRes;

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return errorRes;

  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  await prisma.usuario.update({
    where: { id: Number(session.sub) },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });

  const okRes = NextResponse.redirect(new URL("/perfil?google=ok", req.url));
  okRes.cookies.delete("google_oauth_state");
  return okRes;
}
