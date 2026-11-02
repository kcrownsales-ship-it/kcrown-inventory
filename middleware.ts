import { NextRequest, NextResponse } from "next/server";
import { appMode } from "./lib/access";
import { createServerClient } from "@supabase/ssr";
export async function middleware(request: NextRequest) {
  if (appMode() === "demo") return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    return new NextResponse("Authentication is not configured", {
      status: 503,
    });
  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        for (const x of items) request.cookies.set(x.name, x.value);
        response = NextResponse.next({ request });
        for (const x of items) response.cookies.set(x.name, x.value, x.options);
      },
    },
  });
  await client.auth.getUser();
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
