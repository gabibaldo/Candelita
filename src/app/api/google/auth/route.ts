import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(getAuthUrl(state));
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
