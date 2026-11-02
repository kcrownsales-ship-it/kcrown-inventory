import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/origin";
import { authClient } from "@/lib/auth";
import { appMode } from "@/lib/access";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (appMode() === "production") {
    const client = await authClient();
    const { error } = await client.auth.signOut();
    if (error) return NextResponse.json({ error: "登出失敗" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
