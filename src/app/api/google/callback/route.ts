import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/perfil?google=error", req.url));

  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  await (prisma.usuario as any).update({
    where: { id: Number(session.sub) },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });

  return NextResponse.redirect(new URL("/perfil?google=ok", req.url));
}
