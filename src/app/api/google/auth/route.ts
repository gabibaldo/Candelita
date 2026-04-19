import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.redirect(getAuthUrl());
}
