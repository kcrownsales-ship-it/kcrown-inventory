import { sameOrigin } from "@/lib/origin";
import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth";
import { approvedUser, appMode } from "@/lib/access";
import { z } from "zod";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (appMode() === "demo")
    return NextResponse.json({ error: "Demo 不需登入" }, { status: 409 });
  const body = await req.json().catch(() => null);
  if (
    !body ||
    !z.string().email().safeParse(body.email).success ||
    typeof body.password !== "string" ||
    body.password.length > 1024
  )
    return NextResponse.json({ error: "請輸入帳號密碼" }, { status: 400 });
  const client = await authClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });
  if (!error && data.user && !approvedUser(data.user.id)) {
    await client.auth.signOut();
    return NextResponse.json({ error: "此帳號未獲授權" }, { status: 403 });
  }
  return NextResponse.json(error ? { error: "登入失敗" } : { ok: true }, {
    status: error ? 401 : 200,
  });
}
